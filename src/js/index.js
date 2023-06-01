import Accordion from "./_Accordion";
import Anchor from "./_Anchor";
import Nav from "./_Nav";

$(() => {
  new Nav().init();
  new Accordion().init();
  new Anchor().init();
});
