//
// Converted from PHP: test-user-example.php
// Source path: test-user-example.php
// Generated: 2025-10-04 00:56:00
// Target: Node.js (server) + browser-friendly ES modules.
// NOTE: This is an automated light conversion. Manual review required.
//
// Environment shims (Node + Browser)
const __ENV__ = { isNode: typeof process !== 'undefined' && process.versions?.node, isBrowser: typeof window !== 'undefined' };

// HTML output helper function
function __outputHtml(lines) {
  console.log(lines.join('\n'));
}

// Module wrapper - encapsulates all code
// The _ parameter provides access to environment variables (GET, POST, SERVER, etc.)
(function(_) {
  // No global variables detected
  

    for (const bookmark of bookmarks) {
        /**
         * Filters the OPML outline link title text.
         *
         * @since 2.2.0
         *
         * @param string $title The OPML outline title text.
         */
        title = apply_filters( 'link_title', bookmark.link_name );
        
__outputHtml([
  `<outline text="`
]);
 console.log(esc_attr( title )); 
__outputHtml([
  `" type="link" xmlUrl="`
]);
 console.log(esc_url( bookmark.link_rss )); 
__outputHtml([
  `" htmlUrl="`
]);
 console.log(esc_url( bookmark.link_url )); 
__outputHtml([
  `" updated="`
]);

                            if ( '0000-00-00 00:00:00' !== bookmark.link_updated ) {
                                console.log(bookmark.link_updated);
                            }
                            
__outputHtml([
  `" />`
]);

    } // $bookmarks


})({
  GET: {},
  POST: {},
  SERVER: {},
  COOKIE: {},
  SESSION: {},
  REQUEST: {},
  FILES: {},
  ENV: process?.env || {}
});

// Selective exports
// No functions to export
export { __ENV__, __outputHtml };
