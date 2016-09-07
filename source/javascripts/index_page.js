$(document).ready(function() {
  $(".button-collapse").sideNav();

  $("#send-message").on("click", function(e) {

    var firstName = $("#first_name").val();
    var lastName = $("#last_name").val();
    var email = $("#email").val();
    var message = $("#message").val();

    // console.log("This is my name " + firstName + " " + lastName);
    // console.log("This is my email " + email);
    // console.log("Here's my message: " + message);

    $.ajax({
    url: "https://formspree.io/nathan.kuik@gmail.com",
    method: "POST",
    data: {name: firstName + " " + lastName, email: email, message: message},
    dataType: "json",
      success: function(data) {
        Materialize.toast('Your message was sent successfully!', 4500);
        $("#contact-form").addClass("hidden");
        $("#success-message").removeClass("hidden");
        Materialize.showStaggeredList("#staggered-list")
      },
      error: function(jqXHR) {
        Materialize.toast('Oops, something went wrong!', 4500);
        alert(jqXHR.responseJSON);
      },
    });

  });
});

