export default class Nav {
  constructor() {
    this.$jsNavBtn = $(".js-navBtn");
    this.$jsAnchor = $(".js-anchor li a");
    this.$header = $(".l-header");
    this.$body = $("body");
    this.savedTop = 0;
  }

  init() {
    this.addEvents();
  }

  addEvents() {
    this.$jsNavBtn.on("click", this.onClickBtn.bind(this));
    this.$jsAnchor.each((i, item) => {
      $(item).on("click", () => {
        this.close();
      });
    });
  }

  onClickBtn(e) {
    const $target = $(e.currentTarget);
    const $parent = $target.parents(".l-header");
    $parent.toggleClass("is-open");
    if ($parent.hasClass("is-open")) {
      this.stopScroll();
    } else {
      this.onScroll();
    }
  }
  close() {
    const $header = $(".l-header");
    $header.removeClass("is-open");
    $("body").removeClass("_fixed");
  }
  stopScroll() {
    // ナビゲーションを開いている時にスクロールを止める

    const top = this.getTop();
    this.savedTop = Math.abs(top);
    this.$body.css("top", top);
    this.$body.addClass("_fixed");
  }

  onScroll() {
    this.$body.removeClass("_fixed");
    // this.$body.css
    $(window).scrollTop(this.savedTop);
  }

  getTop() {
    // ナビゲーションを開いた時のページ位置を取得
    const top = window.pageYOffset;
    return -+top;
  }
}
