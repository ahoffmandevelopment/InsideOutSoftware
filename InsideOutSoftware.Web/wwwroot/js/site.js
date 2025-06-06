// Site JavaScript

// Global function for smooth scrolling
function scrollToSection(sectionId) {
    console.log('Scrolling to section:', sectionId);
    const targetElement = document.getElementById(sectionId);
    if (targetElement) {
        // Smooth scroll to the section
        targetElement.scrollIntoView({            
            behavior: 'smooth',
            block: 'start'
        });
        
        // Update active class on nav links
        document.querySelectorAll('.nav-link').forEach(link => {
            link.classList.remove('active');
            if (link.getAttribute('href') === '#' + sectionId) {
                link.classList.add('active');
            }
        });
    }
    return false;
}

// Back to top button setup
function setupBackToTopButton(dotNetHelper) {
    window.addEventListener('scroll', function() {
        const isVisible = window.pageYOffset > 300;
        dotNetHelper.invokeMethodAsync('UpdateVisibility', isVisible);
    });
}

// Intersection Observer for animation
document.addEventListener('DOMContentLoaded', function() {
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('animate-fade-in');
                observer.unobserve(entry.target);
            }
        });
    }, {
        threshold: 0.1
    });
    
    // Observe all sections
    document.querySelectorAll('section, .project-card, .work-entry').forEach(section => {
        observer.observe(section);
    });
    
    // Active navigation highlighting
    const sections = document.querySelectorAll('section[id]');
    
    function updateActiveNavLink() {
        let current = '';
        let maxVisibleHeight = 0;
        
        sections.forEach(section => {
            const rect = section.getBoundingClientRect();
            const visibleHeight = Math.min(rect.bottom, window.innerHeight) - Math.max(rect.top, 0);
            
            if (visibleHeight > maxVisibleHeight && visibleHeight > 0) {
                maxVisibleHeight = visibleHeight;
                current = section.getAttribute('id');
            }
        });
        
        document.querySelectorAll('.nav-link').forEach(link => {
            link.classList.remove('active');
            if (link.getAttribute('href') === `#${current}`) {
                link.classList.add('active');
            }
        });
    }
    
    window.addEventListener('scroll', updateActiveNavLink);
    updateActiveNavLink(); // Call once on page load
});