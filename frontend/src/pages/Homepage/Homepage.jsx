import NavBar from '../../components/NavBar/NavBar';
import './Homepage.css';
import 'bootstrap/dist/css/bootstrap.min.css';

export default function Homepage() {
  return (
    <div>
      <div className="home-page">
        <NavBar/>
        <div className="hero-text">
          <h1>Big Data<br />Workflow Editor</h1>
          <p>Empowering students to generate<br />PySpark code using English Text</p>
          <a href="/login" className="btn btn-primary try-btn">Try it now</a>
        </div>
      </div>
    </div>
  );
}