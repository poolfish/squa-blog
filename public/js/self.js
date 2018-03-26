$(function(){
    $("a.a_post").click(function(){
    	$.ajax({
			type:"POST",
			url:"/logout",
			data:{
			},
			success:function(data){
				$(location).attr('href', '/'); 
				window.location.reload();
			},
			error:function(){
				alert('error occured while trye to logout!');
			},
		});
	});
});
