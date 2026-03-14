import { Navigate } from 'react-router-dom';

// Index now redirects to /movies
const Index = () => <Navigate to="/movies" replace />;

export default Index;
