// As can be seen below, this file used to contain queries for staff and project data.
// Due to some weird issue with JavaScript scoping and ResourceLoader, it's been moved 
// to ProjectGraph.js. But we would like to figure out what is up with that scoping at 
// some point, and maybe put it back here in the future.
// So I'm keeping this file around as an existing (but empty) file as a reminder.

// - JYJ, 5/8/2014

// /*
// window.queryTask = function(chargeNumber, fiscalYear, success, error) {
// 	jQuery.ajax({
// 		url: "http://projectpages.mitre.org/projects/search",
// 		dataType: 'jsonp',
// 		data: {
// 			charge_code: chargeNumber,
// 			fy: fiscalYear
// 		},
// 		success: function (data, textStatus, jqXHR) {
// 			success(data);
// 		},
// 		error: function (jqXHR, textStatus, errorThrown) {
// 			error(textStatus);
// 		}
// 	});
// };
// 
// window.queryTaskStaff = function(taskId, chargeNumber, success, error) {
// 	jQuery.ajax({
// 		url: "http://projectpages.mitre.org/projects/" + taskId + "/staff.json",
// 		dataType: 'jsonp',
// 		success: function (data, textStatus, jqXHR) {
// 			success(chargeNumber, data);
// 		},
// 		error: function (jqXHR, textStatus, errorThrown) {
// 			error(taskId, chargeNumber, textStatus);
// 		}
// 	});
// };
// */
// window.ProjectGraph.prototype.queryStaffTasks = function(employeeNumber, fiscalYear) {
// 	var tasks = null;
// 	var request =
// '<soap12:Envelope xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:xsd="http://www.w3.org/2001/XMLSchema" xmlns:soap12="http://www.w3.org/2003/05/soap-envelope">' +
// '	<soap12:Body>' +
// '		<GetMyProjectCharges xmlns="http://Mitre.IWWeb.Data.Service.ProjectCharges">' +
// '			<Employee>' + employeeNumber + '</Employee>' +
// '			<FiscalYear>' + fiscalYear + '</FiscalYear>' +
// '		</GetMyProjectCharges>' +
// '	</soap12:Body>' +
// '</soap12:Envelope>';
// 	jQuery.ajax({
// 		url: '/IWWebService/ProjectCharges.asmx?op=GetMyProjectCharges',
// 		type: 'POST',
// 		dataType: 'xml',
// 		contentType: 'text/xml; charset="utf-8"',
// 		async: false,
// 		data: request,
// 		success: function (data, textStatus, jqXHR) {
// 			tasks = [];
// 			var xml = jqXHR.responseText;
// 			jQuery(xml).find('MyProjectCharges').each(function() {
// 				var chargeNumber = $(this).find('ProjectNumber').text();
// 				var taskName = $(this).find('ProjectName').text();
// 				var hours = $(this).find('Hours').text();
// 				var percent = $(this).find('Percent').text();
// 				tasks.push({
// 					chargeNumber: chargeNumber,
// 					taskName: taskName,
// 					hours: Number(hours),
// 					percent: Number(percent)
// 				});
// 			});
// 		},
// 		error: function(jqXHR, textStatus, errorThrown) {
// 			alert("Unable to fetch project charges. This is typically due to an MII data stream outage.");
// 		}
// 	});
// 	return tasks;
// }
// 
// window.ProjectGraph.prototype.queryTaskDelivery = function(chargeNumber, fiscalYear) {
// 	var taskName = null;
// 	var staff = null;
// 	var request =
// '<soap12:Envelope xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:xsd="http://www.w3.org/2001/XMLSchema" xmlns:soap12="http://www.w3.org/2003/05/soap-envelope">' +
// '	<soap12:Body>' +
// '		<GetTaskPhonebookInfo xmlns="http://Mitre.IWWeb.Data.Service.TaskInformation">' +
// '			<TaskNo>' + chargeNumber + '</TaskNo>' +
// '			<fiscalPeriod>' + fiscalYear + '</fiscalPeriod>' +
// '		</GetTaskPhonebookInfo>' +
// '	</soap12:Body>' +
// '</soap12:Envelope>';
// 	jQuery.ajax({
// 		url: '/IWWebService/TaskInformation.asmx?op=GetTaskPhonebookInfo',
// 		type: 'POST',
// 		dataType: 'xml',
// 		contentType: 'text/xml; charset="utf-8"',
// 		async: false,
// 		data: request,
// 		success: function (data, textStatus, jqXHR) {
// 			staff = [];
// 			var xml = jqXHR.responseText;
// 			taskName = jQuery(xml).find('ProjectName').text();
// 			jQuery(xml).find('TotalStaffList StaffTI').each(function() {
// 				var departmentNumber = $(this).find('DepartmentNumber').text();
// 				var temp = $(this).find('Delivery');
// 				delivery = temp.text();
// 				var hours = $(this).find('Hours').text();
// 				var FTEs = $(this).find('FTEs').text();
// 				var personName = $(this).find('PersonName').text();
// 				var expenditureCat = $(this).find('ExpenditureCat').text();
// 				var employeeNumber = $(this).find('Empnum').text();
// 				staff.push({
// 					departmentNumber: departmentNumber,
// 					delivery: Number(delivery),
// 					hours: Number(hours),
// 					FTEs: FTEs,
// 					personName: personName,
// 					expenditureCat: expenditureCat,
// 					employeeNumber: employeeNumber
// 				});
// 			});
// 		}
// 	});
// 	if (taskName == null || staff == null) {
// 		return null;
// 	}
// 	return {
// 		taskName: taskName,
// 		staff: staff
// 	};
// }
// window.ProjectGraph.prototype.queryTags = function(type, uid){
// 	var tags = [];
// 	// simple get request interfacing with proxy script
// 	// proxy.php take in one parameter 'url' with the url you are trying to access
// 	// both ajax request and proxy script is get requests
// 	$.ajax({
// 		// url: '../proxy.php?url=http://info.mitre.org/tags/entity/'+type+'/'+uid+'.json',
// 		url: '/MITRETagInterface/entity/'+type+'/'+uid+'.json',
// 		type: 'GET',
// 		dataType: 'json',
// 		async: false,// must be set to false otherwise tags do not get returned.
// 		success: function(data){
// 			tags = data.tags;
// 		}		
// 	});
// 	return tags;
// }
