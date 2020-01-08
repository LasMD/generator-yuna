import page from 'page';
import {GET} from "./utils/web";
import Slider from "./components/Slider";

function init() {
  page.start();
  Slider.doTick();
  var google = GET("https://www.google.com");
  console.log(google);
  return google;
}

init();
