import { firstLevelTestWithTestContainer } from './generic-chai-http-mocha-test.js';
import { standaloneUserClassicSubTestGroup } from './standalone-user-api.test.js'


//NB: in script (.sh, .bat , ...) : set/export WITHOUT_AUTH=yes // undefined by default
//WITHOUT THAT , security (auth check) will block private requests (post, ..)

firstLevelTestWithTestContainer(
    [
     standaloneUserClassicSubTestGroup()
    ]);

