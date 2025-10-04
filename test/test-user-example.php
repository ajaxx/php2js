<?php
    foreach ( (array) $bookmarks as $bookmark ) :
        /**
         * Filters the OPML outline link title text.
         *
         * @since 2.2.0
         *
         * @param string $title The OPML outline title text.
         */
        $title = apply_filters( 'link_title', $bookmark->link_name );
        ?>
<outline text="<?php echo esc_attr( $title ); ?>" type="link" xmlUrl="<?php echo esc_url( $bookmark->link_rss ); ?>" htmlUrl="<?php echo esc_url( $bookmark->link_url ); ?>" updated="
                            <?php
                            if ( '0000-00-00 00:00:00' !== $bookmark->link_updated ) {
                                echo $bookmark->link_updated;
                            }
                            ?>
" />
        <?php
    endforeach; // $bookmarks
