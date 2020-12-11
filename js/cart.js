
/* Totalt fejlet forsøg på at lave en indkøbs vogn med Ajax i Wordpress, før jeg opdagede
der var et plugin i Wordpress der brugte Woocommerce også */

function woocommerce_ajax_add_to_cart_js() {
    if (function_exists('is_product') && is_product()) {
        wp_enqueue_script('woocommerce-ajax-add-to-cart', plugin_dir_url(__FILE__). 'assets/ajax-add-to-cart.js', array('jquery'), '', true);
    }
}
add_action('wp_enqueue_scripts', 'woocommerce_ajax_add_to_cart_js', 99);

(function ($) {
    $(document).on('click', '.single_add_to_cart_button', function (e) {
        e.preventDefault();
    });
})(jQuery);

$thisbutton = $(this),
    $form = $thisbutton.closest('form.cart'),
    id = $thisbutton.val(),
    product_qty = $form.find('input[name=quantity]').val() || 1,
    product_id = $form.find('input[name=product_id]').val() || id,
    variation_id = $form.find('input[name=variation_id]').val() || 0;

let data = {
    action: 'woocommerce_ajax_add_to_cart',
    product_id: product_id,
    product_sku: '',
    quantity: product_qty,
    variation_id: variation_id,
};

$(document.body).trigger('adding_to_cart', [$thisbutton, data]);

$.ajax({
    type: 'post',
    url: wc_add_to_cart_params.ajax_url,
    data: data,
    beforeSend: function (response) {
        $thisbutton.removeClass('added').addClass('loading');
    },
    complete: function (response) {
        $thisbutton.addClass('added').removeClass('loading');
    },
    success: function (response) {

        if (response.error & response.product_url) {
            window.location = response.product_url;
            return;
        } else {
            $(document.body).trigger('added_to_cart', [response.fragments, response.cart_hash, $thisbutton]);
        }
    },
});

(function ($) {

    $(document).on('click', '.single_add_to_cart_button', function (e) {
        e.preventDefault();

        let $thisbutton = $(this),
            $form = $thisbutton.closest('form.cart'),
            id = $thisbutton.val(),
            product_qty = $form.find('input[name=quantity]').val() || 1,
            product_id = $form.find('input[name=product_id]').val() || id,
            variation_id = $form.find('input[name=variation_id]').val() || 0;

        let data = {
            action: 'woocommerce_ajax_add_to_cart',
            product_id: product_id,
            product_sku: '',
            quantity: product_qty,
            variation_id: variation_id,
        };

        $(document.body).trigger('adding_to_cart', [$thisbutton, data]);

        $.ajax({
            type: 'post',
            url: wc_add_to_cart_params.ajax_url,
            data: data,
            beforeSend: function (response) {
                $thisbutton.removeClass('added').addClass('loading');
            },
            complete: function (response) {
                $thisbutton.addClass('added').removeClass('loading');
            },
            success: function (response) {

                if (response.error && response.product_url) {
                    window.location = response.product_url;
                    return;
                } else {
                    $(document.body).trigger('added_to_cart', [response.fragments, response.cart_hash, $thisbutton]);
                }
            },
        });

        return false;
    });
})(jQuery);

add_action('wp_ajax_woocommerce_ajax_add_to_cart', 'woocommerce_ajax_add_to_cart');
add_action('wp_ajax_nopriv_woocommerce_ajax_add_to_cart', 'woocommerce_ajax_add_to_cart');

function woocommerce_ajax_add_to_cart() {

    $product_id = apply_filters('woocommerce_add_to_cart_product_id', absint($_POST['product_id']));
    $quantity = empty($_POST['quantity']) ? 1 : wc_stock_amount($_POST['quantity']);
    $variation_id = absint($_POST['variation_id']);
    $passed_validation = apply_filters('woocommerce_add_to_cart_validation', true, $product_id, $quantity);
    $product_status = get_post_status($product_id);

    if ($passed_validation && WC() -> cart -> add_to_cart($product_id, $quantity, $variation_id) && 'publish' === $product_status) {

        do_action('woocommerce_ajax_added_to_cart', $product_id);

        if ('yes' === get_option('woocommerce_cart_redirect_after_add')) {
            wc_add_to_cart_message(array($product_id => $quantity), true);
        }

        WC_AJAX:: get_refreshed_fragments();
    } else {

        $data = array(
            'error' => true,
            'product_url' => apply_filters('woocommerce_cart_redirect_after_error', get_permalink($product_id), $product_id));

        echo wp_send_json($data);
    }

    wp_die();
}