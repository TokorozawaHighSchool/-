// root script delegates to src/main.js for now
// If deployed as a single-root, copy build step can inline or bundle.
(function(){
  var s = document.createElement('script');
  s.src = 'src/main.js';
  document.head.appendChild(s);
})();
