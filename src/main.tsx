import { render } from 'preact';
import './styles/tokens.css';
import './styles/kit.css';
import './styles/base.css';
import { App } from './app';

render(<App />, document.getElementById('app')!);
