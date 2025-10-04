<?php
login_header(
    __( 'Registration Form' ),
    wp_get_admin_notice(
        __( 'Register For This Site' ),
        array(
            'type'               => 'info',
            'additional_classes' => array( 'message', 'register' ),
        )
    ),
    $errors
);
