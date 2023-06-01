export default class Accordion {
  constructor() {
    this.$toggleBtn = $(".toggleBtn");
    this.openClass = "is-open";
  }

  init() {
    this.addEvents();
  }

  addEvents() {
    this.$toggleBtn.on("click", this.toggle.bind(this));
  }

  toggle(e) {
    const $target = $(e.currentTarget);
    $target.toggleClass(this.openClass);
    if ($target.hasClass("is-open")) {
      this.open($target);
    } else {
      this.close($target);
    }
  }
  open(target) {
    const $jsAccordion = this.setTarget(target);
    $jsAccordion.slideDown();
  }
  close(target) {
    const $jsAccordion = this.setTarget(target);
    $jsAccordion.slideUp();
  }

  setTarget(el) {
    let $jsAccordion;
    const localName = el[0].localName;
    if (localName === "h3") {
      // h3タグをクリックした時
      $jsAccordion = el.next(".js-accordion");
    } else {
      $jsAccordion = el.children(".js-accordion");
    }
    return $jsAccordion;
  }
}
