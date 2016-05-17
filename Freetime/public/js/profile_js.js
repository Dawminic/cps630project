$(document).ready(function () {

	$('a[href="#toggle-upcoming"]').click(function(){
	    $('#upcoming').toggle(); 
	});

	$('a[href="#toggle-passed"]').click(function(){
	    $('#passed').toggle(); 
	});

	$('a[href="#toggle-pending"]').click(function(){
	    $('#pending').toggle(); 
	});

	$('a[href="#toggle-add"]').click(function(){
	    $('#add').toggle(); 
	});

});