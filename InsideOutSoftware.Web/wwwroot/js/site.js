// Function to resize iframe to fit content
function resizeIframe(iframe) {
    if (iframe) {
        iframe.onload = function() {
            try {
                // Adjust height based on content
                const height = iframe.contentWindow.document.body.scrollHeight;
                iframe.style.height = height + 'px';
            } catch (e) {
                // Cross-origin restrictions may prevent access
                console.log('Could not resize iframe: ', e);
            }
        };
    }
}