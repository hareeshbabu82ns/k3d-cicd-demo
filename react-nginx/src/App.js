import logo from './logo.svg';
import './App.css';

function App() {
  return (
    <div className="App">
      <header className="App-header">
        <img src={logo} className="App-logo" alt="logo" />
        <p>
          React App serving from Nginx on K8S
        </p>
      </header>
    </div>
  );
}

export default App;
