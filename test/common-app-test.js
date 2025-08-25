import {use} from  'chai';
import chaiHttp  from 'chai-http';
import { app , server } from '../server.js';



//NB: in script (.sh, .bat , ...) : set/export WITHOUT_AUTH=yes // undefined by default
//WITHOUT THAT , security (auth check) will block private requests (post, ..)

export const chai=use(chaiHttp); //configure chai to use chaiHttp
//NB: run mocha with --exit option for good server exit after test execution

export const { expect } = chai;

export function retreiveMyAppRequester(){
    return chai.request.execute(app);//"http://localhost:8230" or ...
    //NB: this code may change in other chai,chaiHttp versions
}



