/**
 * Ghar Aangan - Conversion Rate Optimization (CRO) Analytics & Funnel Tracking
 * Tracks full funnel events without polluting analytics with developer/designer testing.
 */
(function() {
  'use strict';

  // Check if session is designer/developer testing mode
  var isDesignMode = false;
  try {
    if (window.Shopify && window.Shopify.designMode) {
      isDesignMode = true;
    }
    if (window.location.search.indexOf('preview_theme_id') !== -1 || window.location.search.indexOf('shopify-preview') !== -1) {
      isDesignMode = true;
    }
  } catch(e) {}

  window.GharAanganAnalytics = {
    isTestMode: isDesignMode,

    trackEvent: function(eventName, eventData) {
      eventData = eventData || {};
      eventData.timestamp = new Date().toISOString();
      eventData.page_url = window.location.href;
      eventData.page_path = window.location.pathname;

      if (this.isTestMode) {
        console.log('[GA CRO Analytics - Test Mode Ignored]', eventName, eventData);
        return;
      }

      // 1. Push to Google DataLayer (GTM / GA4)
      window.dataLayer = window.dataLayer || [];
      window.dataLayer.push({
        event: eventName,
        cro_data: eventData
      });

      // 2. Push to Meta Pixel if initialized
      if (typeof window.fbq === 'function') {
        if (eventName === 'cro_product_view') {
          window.fbq('track', 'ViewContent', {
            content_name: eventData.product_title,
            content_ids: [eventData.product_id || eventData.variant_id],
            content_type: 'product',
            value: eventData.price,
            currency: 'INR'
          });
        } else if (eventName === 'cro_add_to_cart') {
          window.fbq('track', 'AddToCart', {
            content_ids: [eventData.variant_id],
            content_type: 'product',
            value: eventData.price,
            currency: 'INR'
          });
        } else if (eventName === 'cro_buy_now_click' || eventName === 'cro_sticky_buy_click') {
          window.fbq('track', 'InitiateCheckout', {
            content_ids: [eventData.variant_id],
            content_type: 'product',
            value: eventData.price,
            currency: 'INR'
          });
        } else {
          window.fbq('trackCustom', eventName, eventData);
        }
      }
    }
  };

  // Automatic Event Listeners
  document.addEventListener('DOMContentLoaded', function() {
    // 1. Landing page view
    window.GharAanganAnalytics.trackEvent('cro_landing_view', {
      referrer: document.referrer,
      utm_source: new URLSearchParams(window.location.search).get('utm_source') || 'direct',
      device_type: window.innerWidth < 768 ? 'mobile' : 'desktop'
    });

    // 2. Product view tracking
    var productWrap = document.querySelector('.hdt-secion-main-product, .hdt-main-product-wrap');
    if (productWrap) {
      var titleEl = document.querySelector('h1.hdt-product__title, .ga-product-title');
      var priceEl = document.querySelector('.hdt-money, .ga-pack-price');
      window.GharAanganAnalytics.trackEvent('cro_product_view', {
        product_title: titleEl ? titleEl.textContent.trim() : document.title,
        price: priceEl ? priceEl.textContent.trim() : ''
      });
    }

    // 3. Variant selection tracking
    document.addEventListener('change', function(e) {
      if (e.target && (e.target.name === 'id' || e.target.classList.contains('ga-sticky-atc-select') || e.target.matches('[tag-select]'))) {
        window.GharAanganAnalytics.trackEvent('cro_variant_change', {
          variant_id: e.target.value
        });
      }
    });

    // 4. Add to cart form submit tracking
    document.addEventListener('submit', function(e) {
      if (e.target && e.target.action && e.target.action.indexOf('/cart/add') !== -1) {
        var idInput = e.target.querySelector('input[name="id"]');
        window.GharAanganAnalytics.trackEvent('cro_add_to_cart', {
          variant_id: idInput ? idInput.value : ''
        });
      }
    });

    // 5. FAQ expansion tracking
    document.addEventListener('toggle', function(e) {
      if (e.target && e.target.tagName === 'DETAILS' && e.target.open && e.target.classList.contains('ga-faq-item')) {
        var summary = e.target.querySelector('summary');
        window.GharAanganAnalytics.trackEvent('cro_faq_expand', {
          question: summary ? summary.textContent.trim() : ''
        });
      }
    }, true);
  });
})();
