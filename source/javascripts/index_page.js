$(document).ready(function() {
  $(".button-collapse").sideNav();

  // $("#contactForm").validate({
  // rules: {
  //     first_name: "required",
  //     email: {
  //       required: true,
  //       email: true
  //     }
  //   },

    submitHandler: function(form) {
      $.ajax({
        dataType: 'jsonp',
        url: "http://getsimpleform.com/messages/ajax?form_api_token=457fbb20f41eab9dc5dc36155a55acb4",
            data: $("#contactForm").serialize()
          }).done(function() {
        //callback which can be used to show a thank you message
        //and reset the form
        window.location.href = "/confirm.html";
      });
    }
  });

// });
