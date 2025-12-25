(function ($) {
  'use strict';

  $(function () {
    console.log('%c[HOVERABLE-COLLAPSE] Script loaded', 'color: green; font-weight: bold');
    var body = $('body');
    var hoverTimeout;

    // Hover behavior khi sidebar minimized - hover vào nav-item HOẶC submenu
    $(document).on('mouseenter', '.sidebar .nav-item', function () {
      var sidebarIconOnly = body.hasClass("sidebar-icon-only");

      if ('ontouchstart' in document.documentElement) {
        return;
      }

      if (sidebarIconOnly) {
        clearTimeout(hoverTimeout);

        var $menuItem = $(this);
        var $collapse = $menuItem.find('.collapse');

        if ($collapse.length > 0 && !$menuItem.hasClass('pinned')) {
          // Đóng các menu khác (không pinned)
          $('.sidebar .nav-item').not('.pinned').removeClass('hover-open').find('.collapse').removeClass('show');

          // Mở menu này
          $menuItem.addClass('hover-open');
          $collapse.addClass('show');
        }
      }
    });

    // Mouseleave với delay để có thời gian di chuột vào submenu
    $(document).on('mouseleave', '.sidebar .nav-item', function () {
      var sidebarIconOnly = body.hasClass("sidebar-icon-only");

      if (sidebarIconOnly) {
        var $menuItem = $(this);

        // Chỉ ẩn nếu không phải pinned
        if (!$menuItem.hasClass('pinned')) {
          clearTimeout(hoverTimeout);
          hoverTimeout = setTimeout(function () {
            $menuItem.removeClass('hover-open');
            $menuItem.find('.collapse').removeClass('show');
          }, 300); // Delay 300ms để có thời gian di chuột vào submenu
        }
      }
    });

    // Click để PIN submenu khi minimized, hoặc toggle collapse khi expanded
    $(document).on('click', '.sidebar .nav-link[data-bs-toggle="collapse"]', function (e) {
      e.preventDefault(); // LUÔN prevent để tránh thêm # vào URL

      var sidebarIconOnly = body.hasClass("sidebar-icon-only");
      var $this = $(this);
      var $menuItem = $this.closest('.nav-item');
      var $collapse = $menuItem.find('.collapse');

      console.log('%c[HOVERABLE-COLLAPSE] Menu clicked', 'color: blue', {
        minimized: sidebarIconOnly,
        menu: $this.find('.menu-title').text(),
        collapseId: $collapse.attr('id')
      });

      if (sidebarIconOnly) {
        // Sidebar minimized: PIN/UNPIN submenu
        e.stopPropagation();

        if ($menuItem.hasClass('pinned')) {
          $menuItem.removeClass('pinned hover-open');
          $collapse.removeClass('show');
          console.log('Unpinned submenu');
        } else {
          // Unpin tất cả menu khác
          $('.sidebar .nav-item').removeClass('pinned hover-open').find('.collapse').removeClass('show');

          // Pin menu này
          $menuItem.addClass('pinned hover-open');
          $collapse.addClass('show');
          console.log('%c[HOVERABLE-COLLAPSE] Pinned submenu', 'color: orange');
        }
      } else {
        // Sidebar expanded: Toggle collapse bình thường
        var wasOpen = $collapse.hasClass('show');
        $collapse.toggleClass('show');
        console.log('%c[HOVERABLE-COLLAPSE] Toggle expanded submenu', 'color: purple', {
          wasOpen: wasOpen,
          nowOpen: $collapse.hasClass('show')
        });
      }

      return false;
    });

    // Click ra ngoài để đóng pinned menu
    $(document).on('click', function (e) {
      var sidebarIconOnly = body.hasClass("sidebar-icon-only");

      if (sidebarIconOnly) {
        if (!$(e.target).closest('.sidebar').length) {
          $('.sidebar .nav-item.pinned').removeClass('pinned hover-open').find('.collapse').removeClass('show');
        }
      }
    });
  });
})(jQuery);