/*
window.queryTask = function(chargeNumber, fiscalYear, success, error) {
	jQuery.ajax({
		url: "http://projectpages.mitre.org/projects/search",
		dataType: 'jsonp',
		data: {
			charge_code: chargeNumber,
			fy: fiscalYear
		},
		success: function (data, textStatus, jqXHR) {
			success(data);
		},
		error: function (jqXHR, textStatus, errorThrown) {
			error(textStatus);
		}
	});
};

window.queryTaskStaff = function(taskId, chargeNumber, success, error) {
	jQuery.ajax({
		url: "http://projectpages.mitre.org/projects/" + taskId + "/staff.json",
		dataType: 'jsonp',
		success: function (data, textStatus, jqXHR) {
			success(chargeNumber, data);
		},
		error: function (jqXHR, textStatus, errorThrown) {
			error(taskId, chargeNumber, textStatus);
		}
	});
};
*/
window.queryStaffTasks = function(employeeNumber, fiscalYear) {
	var tasks = null;
	var request =
'<soap12:Envelope xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:xsd="http://www.w3.org/2001/XMLSchema" xmlns:soap12="http://www.w3.org/2003/05/soap-envelope">' +
'	<soap12:Body>' +
'		<GetMyProjectCharges xmlns="http://Mitre.IWWeb.Data.Service.ProjectCharges">' +
'			<Employee>' + employeeNumber + '</Employee>' +
'			<FiscalYear>' + fiscalYear + '</FiscalYear>' +
'		</GetMyProjectCharges>' +
'	</soap12:Body>' +
'</soap12:Envelope>';
	jQuery.ajax({
		url: '/IWWebService/ProjectCharges.asmx?op=GetMyProjectCharges',
		type: 'POST',
		dataType: 'xml',
		contentType: 'text/xml; charset="utf-8"',
		async: false,
		data: request,
		success: function (data, textStatus, jqXHR) {
			tasks = [];
			var xml = jqXHR.responseText;
			jQuery(xml).find('MyProjectCharges').each(function() {
				var chargeNumber = jQuery(this).find('ProjectNumber').text();
				var taskName = jQuery(this).find('ProjectName').text();
				var hours = jQuery(this).find('Hours').text();
				var percent = jQuery(this).find('Percent').text();
				tasks.push({
					chargeNumber: chargeNumber,
					taskName: taskName,
					hours: Number(hours),
					percent: Number(percent)
				});
			});
		},
		error: function(jqXHR, textStatus, errorThrown) {
			alert("Unable to fetch project charges.");
		}
	});
	return tasks;
};

window.queryTaskDelivery = function(chargeNumber, fiscalYear) {
	var taskName = null;
	var staff = null;
	var request =
'<soap12:Envelope xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:xsd="http://www.w3.org/2001/XMLSchema" xmlns:soap12="http://www.w3.org/2003/05/soap-envelope">' +
'	<soap12:Body>' +
'		<GetTaskPhonebookInfo xmlns="http://Mitre.IWWeb.Data.Service.TaskInformation">' +
'			<TaskNo>' + chargeNumber + '</TaskNo>' +
'			<fiscalPeriod>' + fiscalYear + '</fiscalPeriod>' +
'		</GetTaskPhonebookInfo>' +
'	</soap12:Body>' +
'</soap12:Envelope>';
	jQuery.ajax({
		url: '/IWWebService/TaskInformation.asmx?op=GetTaskPhonebookInfo',
		type: 'POST',
		dataType: 'xml',
		contentType: 'text/xml; charset="utf-8"',
		async: false,
		data: request,
		success: function (data, textStatus, jqXHR) {
			staff = [];
			var xml = jqXHR.responseText;
			taskName = jQuery(xml).find('ProjectName').text();
			jQuery(xml).find('TotalStaffList StaffTI').each(function() {
				var departmentNumber = jQuery(this).find('DepartmentNumber').text();
				var delivery = jQuery(this).find('Delivery').text();
				var hours = jQuery(this).find('Hours').text();
				var FTEs = jQuery(this).find('FTEs').text();
				var personName = jQuery(this).find('PersonName').text();
				var expenditureCat = jQuery(this).find('ExpenditureCat').text();
				var employeeNumber = jQuery(this).find('Empnum').text();
				staff.push({
					departmentNumber: departmentNumber,
					delivery: Number(delivery),
					hours: Number(hours),
					FTEs: FTEs,
					personName: personName,
					expenditureCat: expenditureCat,
					employeeNumber: employeeNumber
				});
			});
		}
	});
	if (taskName == null || staff == null) {
		return null;
	}
	return {
		taskName: taskName,
		staff: staff
	};
};
