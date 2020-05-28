module.exports.renderHome = function(args){
    Object.assign(this, args);
    return `
    <!doctype html>
    <html lang="en">
    <head>
    <style>

        html, body{
            height: 100%;
        }
        main {
            padding:30px;
        }
        div {
            flex-direction:column; 
            width:100%; 
            height:100%
        }
        ul {
            list-style: circle;
        }
    </style>
    </head>
    <body >
        <main>
           <h3>This is dj truck soundcloud api. </h3>
           <h5>SoundCluod Api contains follow routes:</h5>
           <ul>
                <li>/download?id=</li>
                <li>/search?id= &maxResult=</li>
           </ul>
        </main>
    </body>
`
}