package com.example.heartcabinbridge

import android.os.Bundle
import android.text.method.ScrollingMovementMethod
import android.widget.TextView
import android.widget.Toast
import androidx.activity.result.contract.ActivityResultContracts
import androidx.appcompat.app.AppCompatActivity
import androidx.health.connect.client.HealthConnectClient
import androidx.health.connect.client.permission.HealthPermission
import androidx.health.connect.client.permission.PermissionController
import androidx.health.connect.client.records.HeartRateRecord
import androidx.health.connect.client.records.SleepSessionRecord
import androidx.health.connect.client.records.StepsRecord
import androidx.health.connect.client.time.TimeRangeFilter
import androidx.lifecycle.lifecycleScope
import com.google.android.material.button.MaterialButton
import com.google.android.material.textfield.TextInputEditText
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext
import org.json.JSONObject
import java.io.BufferedReader
import java.io.InputStreamReader
import java.net.HttpURLConnection
import java.net.URL
import java.time.Duration
import java.time.Instant
import java.time.LocalDate
import java.time.ZoneId
import kotlin.math.roundToInt

class MainActivity : AppCompatActivity() {

    private lateinit var availabilityText: TextView
    private lateinit var bridgeHint: TextView
    private lateinit var backendUrlInput: TextInputEditText
    private lateinit var userIdInput: TextInputEditText
    private lateinit var refreshButton: MaterialButton
    private lateinit var permissionButton: MaterialButton
    private lateinit var syncButton: MaterialButton
    private lateinit var statusText: TextView

    private var healthConnectClient: HealthConnectClient? = null
    private val bridgePreferences by lazy { getSharedPreferences(PREF_NAME, MODE_PRIVATE) }

    private val requiredPermissions = setOf(
        HealthPermission.getReadPermission(HeartRateRecord::class),
        HealthPermission.getReadPermission(StepsRecord::class),
        HealthPermission.getReadPermission(SleepSessionRecord::class)
    )

    private val permissionLauncher = registerForActivityResult(
        PermissionController.createRequestPermissionResultContract()
    ) { grantedPermissions ->
        if (grantedPermissions.containsAll(requiredPermissions)) {
            appendStatus("Health Connect 权限已授予，可以开始同步。")
        } else {
            appendStatus("Health Connect 权限尚未全部授予，无法读取完整数据。")
        }
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_main)

        availabilityText = findViewById(R.id.availabilityText)
        bridgeHint = findViewById(R.id.bridgeHint)
        backendUrlInput = findViewById(R.id.backendUrlInput)
        userIdInput = findViewById(R.id.userIdInput)
        refreshButton = findViewById(R.id.refreshButton)
        permissionButton = findViewById(R.id.permissionButton)
        syncButton = findViewById(R.id.syncButton)
        statusText = findViewById(R.id.statusText)

        statusText.movementMethod = ScrollingMovementMethod()
        statusText.text = "准备就绪。\n"

        loadSavedConfig()
        bridgeHint.text = "小米运动健康的数据需要先同步到 Health Connect，再由这个桥接 App 读取并上传到心晴小屋。建议先在小米运动健康里开启 Health Connect 同步。"

        refreshButton.setOnClickListener {
            refreshHealthConnectState()
        }
        permissionButton.setOnClickListener {
            requestPermissionsIfPossible()
        }
        syncButton.setOnClickListener {
            lifecycleScope.launch {
                syncTodayData()
            }
        }

        refreshHealthConnectState()
    }

    override fun onPause() {
        super.onPause()
        persistConfig()
    }

    private fun refreshHealthConnectState() {
        healthConnectClient = try {
            HealthConnectClient.getOrCreate(this)
        } catch (error: Exception) {
            null
        }

        if (healthConnectClient == null) {
            availabilityText.text = "Health Connect 当前不可用。请确认手机已安装/启用 Health Connect，或在系统中完成更新。"
            permissionButton.isEnabled = false
            syncButton.isEnabled = false
            appendStatus("Health Connect 不可用，暂时无法同步。")
            return
        }

        availabilityText.text = "Health Connect 已就绪。若小米运动健康已经开启同步，就可以读取今天的数据。"
        permissionButton.isEnabled = true
        syncButton.isEnabled = true
        appendStatus("Health Connect 检查完成。")
    }

    private fun requestPermissionsIfPossible() {
        val client = healthConnectClient
        if (client == null) {
            appendStatus("Health Connect 不可用，无法请求权限。")
            Toast.makeText(this, "Health Connect 不可用", Toast.LENGTH_SHORT).show()
            return
        }
        permissionLauncher.launch(requiredPermissions)
    }

    private suspend fun syncTodayData() {
        val client = healthConnectClient
        if (client == null) {
            appendStatus("Health Connect 不可用，请先检查系统支持情况。")
            return
        }

        val backendUrl = backendUrlInput.text?.toString()?.trim().orEmpty()
        val userIdText = userIdInput.text?.toString()?.trim().orEmpty()

        if (backendUrl.isBlank()) {
            appendStatus("请先填写后端地址。")
            return
        }
        if (userIdText.isBlank()) {
            appendStatus("请先填写用户 ID。")
            return
        }

        val userId = userIdText.toLongOrNull()
        if (userId == null) {
            appendStatus("用户 ID 格式不正确，请输入数字。")
            return
        }

        val grantedPermissions = try {
            client.permissionController.getGrantedPermissions()
        } catch (error: Exception) {
            emptySet<String>()
        }

        if (!grantedPermissions.containsAll(requiredPermissions)) {
            appendStatus("权限不足，正在请求读取健康数据的权限。")
            permissionLauncher.launch(requiredPermissions)
            return
        }

        appendStatus("正在从 Health Connect 读取今日数据...")
        val payload = try {
            withContext(Dispatchers.IO) {
                collectTodayPayload(client, userId)
            }
        } catch (error: Exception) {
            appendStatus("读取 Health Connect 数据失败：${error.message ?: "未知错误"}")
            return
        }

        appendStatus("正在把数据上传到心晴小屋...")
        val resultMessage = try {
            withContext(Dispatchers.IO) {
                uploadPayload(backendUrl, payload)
            }
        } catch (error: Exception) {
            "上传失败：${error.message ?: "未知错误"}"
        }

        appendStatus(resultMessage)
        persistConfig()
    }

    private suspend fun collectTodayPayload(client: HealthConnectClient, userId: Long): BridgePayload {
        val zoneId = ZoneId.systemDefault()
        val todayStart = LocalDate.now().atStartOfDay(zoneId).toInstant()
        val now = Instant.now()
        val yesterdayStart = LocalDate.now().minusDays(1).atStartOfDay(zoneId).toInstant()

        val heartRateRecords = client.readRecords(
            HeartRateRecord::class,
            timeRangeFilter = TimeRangeFilter.between(todayStart, now)
        ).records
        val heartRate = heartRateRecords
            .asSequence()
            .flatMap { it.samples.asSequence() }
            .maxByOrNull { it.time }
            ?.beatsPerMinute
            ?.toInt()

        val stepsRecords = client.readRecords(
            StepsRecord::class,
            timeRangeFilter = TimeRangeFilter.between(todayStart, now)
        ).records
        val steps = stepsRecords.sumOf { it.count.toInt() }

        val sleepRecords = client.readRecords(
            SleepSessionRecord::class,
            timeRangeFilter = TimeRangeFilter.between(yesterdayStart, now)
        ).records
        val sleepMinutes = sleepRecords.sumOf {
            Duration.between(it.startTime, it.endTime).toMinutes()
        }
        val sleepHours = if (sleepMinutes > 0) {
            (sleepMinutes / 6.0).roundToInt() / 10.0
        } else {
            null
        }

        return BridgePayload(
            userId = userId,
            heartRate = heartRate,
            sleepHours = sleepHours,
            steps = steps,
            recordDate = LocalDate.now().toString(),
            dataSource = "health_connect"
        )
    }

    private fun uploadPayload(backendUrl: String, payload: BridgePayload): String {
        val targetUrl = URL("${backendUrl.trimEnd('/')}/report/add")
        val connection = (targetUrl.openConnection() as HttpURLConnection).apply {
            requestMethod = "POST"
            connectTimeout = 15000
            readTimeout = 15000
            doInput = true
            doOutput = true
            setRequestProperty("Content-Type", "application/json; charset=UTF-8")
        }

        return try {
            val jsonBody = JSONObject().apply {
                put("userId", payload.userId)
                put("heartRate", payload.heartRate ?: JSONObject.NULL)
                put("sleepHours", payload.sleepHours ?: JSONObject.NULL)
                put("steps", payload.steps ?: JSONObject.NULL)
                put("recordDate", payload.recordDate)
                put("dataSource", payload.dataSource)
            }

            connection.outputStream.use { outputStream ->
                outputStream.write(jsonBody.toString().toByteArray(Charsets.UTF_8))
                outputStream.flush()
            }

            val responseCode = connection.responseCode
            val responseText = readConnectionBody(connection, responseCode)
            if (responseCode in 200..299) {
                saveLastSyncState()
                "同步成功：$responseText"
            } else {
                "同步失败（HTTP $responseCode）：$responseText"
            }
        } finally {
            connection.disconnect()
        }
    }

    private fun readConnectionBody(connection: HttpURLConnection, responseCode: Int): String {
        val inputStream = if (responseCode in 200..299) connection.inputStream else connection.errorStream
        if (inputStream == null) {
            return ""
        }
        return inputStream.use { stream ->
            BufferedReader(InputStreamReader(stream, Charsets.UTF_8)).use { reader ->
                reader.readText()
            }
        }
    }

    private fun appendStatus(message: String) {
        val currentText = statusText.text?.toString().orEmpty()
        val updatedText = if (currentText.isBlank()) {
            message
        } else {
            "$currentText\n$message"
        }
        statusText.text = updatedText
    }

    private fun loadSavedConfig() {
        backendUrlInput.setText(bridgePreferences.getString(KEY_BACKEND_URL, "http://10.0.2.2:8080"))
        userIdInput.setText(bridgePreferences.getString(KEY_USER_ID, ""))
    }

    private fun persistConfig() {
        bridgePreferences.edit()
            .putString(KEY_BACKEND_URL, backendUrlInput.text?.toString()?.trim().orEmpty())
            .putString(KEY_USER_ID, userIdInput.text?.toString()?.trim().orEmpty())
            .apply()
    }

    private fun saveLastSyncState() {
        bridgePreferences.edit()
            .putString(KEY_LAST_SYNC, Instant.now().toString())
            .apply()
    }

    private data class BridgePayload(
        val userId: Long,
        val heartRate: Int?,
        val sleepHours: Double?,
        val steps: Int,
        val recordDate: String,
        val dataSource: String
    )

    companion object {
        private const val PREF_NAME = "heart_cabin_mobile_bridge"
        private const val KEY_BACKEND_URL = "backend_url"
        private const val KEY_USER_ID = "user_id"
        private const val KEY_LAST_SYNC = "last_sync"
    }
}
