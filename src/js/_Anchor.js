export default class Anchor {
  constructor() {
    this.$anchorLinks = $('.js-anchor li a')
  }
  init() {
    this.addEvents()
  }
  addEvents() {
    this.$anchorLinks.on('click', this.anchorScroll.bind(this))
  }

  anchorScroll(e) {
    const $target = $(e.currentTarget)
    const position = this.getPosition($target)
    this.smoothScroll(position)
  }

  smoothScroll(position) {
    $('body,html').animate({ scrollTop: position }, 800, 'swing')
    return false
  }

  getPosition(el) {
    const href = el.attr('href')
    const target = $(href == '#' || href == '' ? 'html' : href)
    const position = target.offset().top - 80
    return position
  }
}
