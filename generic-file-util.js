import fs from 'fs/promises';

export async function readBasicTextFile(fileName){
	let data = await fs.readFile(fileName, 'utf8');
	data = data.replace(/^\s+|\s+$/g, ''); //trim \n and ... at start or end of line if necessary
	return data;
}

export async function readJsonTextFile(fileName){
  let data = await readBasicTextFile(fileName);
  return JSON.parse(data);
}
