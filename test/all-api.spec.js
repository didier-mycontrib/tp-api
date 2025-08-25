import { deviseClassicTest } from './devise-api.test.js'
import { productClassicTest } from './product-api.test.js'
import { standaloneUserClassicTest } from './standalone-user-api.test.js'


//NB: in script (.sh, .bat , ...) : set/export WITHOUT_AUTH=yes // undefined by default
//WITHOUT THAT , security (auth check) will block private requests (post, ..)

deviseClassicTest();
productClassicTest();
standaloneUserClassicTest();

