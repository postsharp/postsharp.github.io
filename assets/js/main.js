var swiper = new Swiper('.swiper-container', {
  navigation: {
    nextEl: '.swiper-button-next',
    prevEl: '.swiper-button-prev',
  },
  pagination: {
    el: '.swiper-pagination',
    clickable: true,
    renderBullet: function (index, className) {
      return '<span class="' + className + '">' + (index + 1) + '</span>';
    },
  },
});



const preElements = document.getElementsByTagName('pre');
const codeElements = document.getElementsByTagName('code');
for (let preElemet of preElements) {
  preElemet.classList.add("prettyprint");
}
for (let codeElement of codeElements) {
  codeElement.classList.add("prettyprint");
}




