module.exports.renderHome = function(args){
    Object.assign(this, args);
    return `
    <!doctype html>
    <html lang="en">
    <head>
    <style>
        * {
            margin:0;
            padding:0;
        }
        html, body{
            height: 100%;
        }
        div {
            display:flex; 
            justify-content:center; 
            align-content:center; 
            flex-direction:column; 
            text-align: center;
            width:100%; 
            height:100%
        }
    </style>
    </head>
    <body >
        <div style="">
           <h3>Hellow</h3>
        </div>
    </body>
`
}