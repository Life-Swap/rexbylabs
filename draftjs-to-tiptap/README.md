# draftjs-to-tiptap

draftjs to tiptap markup converter

## install

`npm i @rexby/draftjs-to-tiptap` 
or  
`yarn add @rexby/draftjs-to-tiptap`

### Usage

	import { draftjsToTiptap } from "@rexby/draftjs-to-tiptap";

	draftjsToTiptap(draftjsDocument, {
		// If you have @mentions in your draftjs documents you need to supply a
		// function to convert draftjs entity to tiptap mention attributes.
		// `entity.data.mention` will depend on how you configured your draftjs
		// editor, and you need to return an object with id and label as tiptap
		// expects
		getMentionAttrs: (entity) => {
			return {
				id: entity.data.mention.id,
				label: entity.data.mention.name
			};
		},
	})

Input and output are json objects. If you store your documents as strings you will need to `JSON.parse` the input and `JSON.stringify` the output yourself.
