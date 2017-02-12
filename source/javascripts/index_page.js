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

    $.ajax({
    url: "http://formspree.io/nathan@nathankuik.com",
    method: "POST",
    data: {name: name, email: email, message: message},
    dataType: "json",
      success: function(data) {
        Materialize.toast('Your message was sent successfully!', 4500);
        $("#contact-form").addClass("hidden");
        $("#success-message").removeClass("hidden");
        Materialize.showStaggeredList("#staggered-list")
      },
      error: function() {
        Materialize.toast('Oops, something went wrong! Try emailing me instead: nathan@nathankuik.com', 6500);
      },
    });
  });
});

(function(i,s,o,g,r,a,m){i['GoogleAnalyticsObject']=r;i[r]=i[r]||function(){
(i[r].q=i[r].q||[]).push(arguments)},i[r].l=1*new Date();a=s.createElement(o),
m=s.getElementsByTagName(o)[0];a.async=1;a.src=g;m.parentNode.insertBefore(a,m)
})(window,document,'script','https://www.google-analytics.com/analytics.js','ga');

ga('create', 'UA-91846507-1', 'auto');
ga('send', 'pageview');
