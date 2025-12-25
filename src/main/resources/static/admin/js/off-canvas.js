(function ($) {
  'use strict';

  $(function () {
    console.log('%c[OFF-CANVAS] Script loaded', 'color: green; font-weight: bold');

    // Offcanvas toggle (mobile)
    $('[data-bs-toggle="offcanvas"]').on("click", function (e) {
      e.preventDefault();
      $('.sidebar-offcanvas').toggleClass('active');
      console.log('%c[OFF-CANVAS] Offcanvas toggled', 'color: blue');
    });

    // Sidebar minimize toggle
    $('[data-bs-toggle="minimize"]').on("click", function (e) {
      e.preventDefault();
      e.stopPropagation();
      $('body').toggleClass('sidebar-icon-only');

      // Save state
      var isMinimized = $('body').hasClass('sidebar-icon-only');
      localStorage.setItem('sidebarMinimized', isMinimized);

      console.log('%c[OFF-CANVAS] Sidebar toggled:', 'color: orange; font-weight: bold', isMinimized ? 'minimized' : 'expanded');
    });
  });
})(jQuery);