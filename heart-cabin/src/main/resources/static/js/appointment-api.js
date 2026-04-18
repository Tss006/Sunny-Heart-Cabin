(function() {
	function withToken(config) {
		const token = localStorage.getItem('token');
		const nextConfig = Object.assign({}, config || {});
		nextConfig.headers = Object.assign({}, nextConfig.headers || {});
		if (token) {
			nextConfig.headers.token = token;
		}
		return nextConfig;
	}

	function getUserAppointments() {
		return axios.get('/appointment', withToken());
	}

	function getCounselorAppointments() {
		return axios.get('/appointment/counselor', withToken());
	}

	function createAppointment(payload) {
		return axios.post('/appointment', payload, withToken());
	}

	function updateAppointmentStatus(appointmentId, status) {
		return axios.put('/appointment/' + appointmentId + '/status', { status: status }, withToken());
	}

	function getAvailableTimes(counselorId) {
		return axios.get('/appointment/available-times', withToken({ params: { counselorId: counselorId } }));
	}

	function saveAvailableTime(payload) {
		return axios.post('/appointment/available-times', payload, withToken());
	}

	window.heartCabinAppointmentApi = {
		getUserAppointments: getUserAppointments,
		getCounselorAppointments: getCounselorAppointments,
		createAppointment: createAppointment,
		updateAppointmentStatus: updateAppointmentStatus,
		getAvailableTimes: getAvailableTimes,
		saveAvailableTime: saveAvailableTime
	};
})();
