import  { expect } from 'chai'; //but not import chai from 'chai' !!!

describe("my basic tests", ()=>{
	
	it("1+2==3", function() {
		let x=1
		let y=2
		let z=x+y;
		console.log(`x=${x} y=${y} z=x+y=${z}`);
		expect(z).to.equals(3);
    });
	
});