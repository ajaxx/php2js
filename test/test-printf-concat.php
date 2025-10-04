<?php
printf(
    /* translators: %s: Admin email address. */
    __( 'Current administration email: %s' ),
    '<strong>' . esc_html( $admin_email ) . '</strong>'
);
