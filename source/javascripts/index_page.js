$(document).ready(function() {
  $('.button-collapse').sideNav({
      menuWidth: 250, // Default is 240
      edge: 'right', // Choose the horizontal origin
      closeOnClick: true // Closes side-nav on <a> clicks, useful for Angular/Meteor
    }
  );

  $('.scrollspy').scrollSpy();

  // var options = [
  //   {selector: '#about-card', offset: 300, callback: function(el) {
  //       // $("#about-card").removeClass("hidden");
  //       Materialize.showStaggeredList($(el));
  //     } }
  // ];

  // Materialize.scrollFire(options);

  $("#send-message").on("click", function(e) {

    var name = $("#name").val();
    // var lastName = $("#last_name").val();
    var email = $("#email").val();
    var message = $("#message").val();

    // console.log("This is my name " + firstName + " " + lastName);
    // console.log("This is my email " + email);
    // console.log("Here's my message: " + message);

    $.ajax({
    url: "https://formspree.io/nathan.kuik@gmail.com",
    method: "POST",
    data: {name: name, email: email, message: message},
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
  // navbar show after scrll
  $(function () {
    $(window).scroll(function () {
            // set distance user needs to scroll before we fadeIn navbar
      if ($(this).scrollTop() > 80) {
        $('.nav').(addClass('nav-fixed');
      } else {
        $('.nav').(removeClass('nav-fixed');
      }
    });


  });
});
