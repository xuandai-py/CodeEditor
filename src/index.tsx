import * as esbuild from 'esbuild-wasm';
import { useState, useEffect, useRef } from 'react';
import ReactDOM from 'react-dom';
import { unpkgPathPlugin } from './plugins/unpkg-path-plugin';
import { fetchPlugin } from './plugins/fetch-plugin';

const App = () => {
  const ref = useRef<any>();
  const iframe = useRef<any>();
  const [input, setInput] = useState('');

  const startService = async () => {
    ref.current = await esbuild.startService({
      worker: true,
      wasmURL: 'https://unpkg.com/esbuild-wasm@0.8.27/esbuild.wasm',
    });
  };
  useEffect(() => {
    startService();
  }, []);

  const onClick = async () => {
    if (!ref.current) {
      return;
    }

    iframe.current.srcdoc = html; //rewrite general iframe

    const result = await ref.current.build({
      entryPoints: ['index.js'],
      bundle: true,
      write: false,
      plugins: [unpkgPathPlugin(), fetchPlugin(input)],
      define: {
        'process.env.NODE_ENV': '"production"',
        global: 'window',
      },
    });

    //setCode(result.outputFiles[0].text); // using it before to print out the bundle code on the screen
    iframe.current.contentWindow.postMessage(result.outputFiles[0].text, '*');
  };

  const html = `
    <html>
      <head></head>
      <body>
        <div id="root" ></div>
        <script>
          window.addEventListener('message', (event) => {
            try{
              eval(event.data);
            } catch (error){
              const root = document.querySelector('#root');
              root.innerHTML = '<div style="color: red;"> <h4>Runtime Error: </h4>' + error + '</div> <h5>/n Check the console for more infor</h5>';
              console.error(error);
            }
          }, false);
        </script>
      </body>
    </html>
  `;
  // note that excutation may takes longer on firefox browser

  return (
    <div>
      <textarea
        value={input}
        onChange={(e) => setInput(e.target.value)}
      ></textarea>
      <div>
        <button onClick={onClick}>Submit</button>
      </div>
      <iframe
        title="Preview sandbox"
        ref={iframe}
        sandbox="allow-scripts"
        srcDoc={html}
      />
      {/*// whenever we gor the result rather than updating the state, we init a message down into the iframe  */}
    </div>
  );
};

ReactDOM.render(<App />, document.querySelector('#root'));
