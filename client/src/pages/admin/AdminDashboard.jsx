const AdminDashboard = () => {
  return (
    <div>
      <h1 className="admin-page-title">Tableau de Bord Administrateur</h1>
      
      <div className="grid-auto">
        <div className="bg-white padding-md border-radius-md shadow-sm">
          <h3 className="text-primary margin-top-none">Bienvenue sur CoreLab Admin</h3>
          <p className="text-muted" style={{ lineHeight: '1.6' }}>
            Vous êtes connecté en tant qu'administrateur. Utilisez le menu latéral pour 
            gérer les étudiants, les cours et suivre les résultats.
          </p>
          <p className="text-muted">
            Sélectionnez une option dans le menu pour commencer.
          </p>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
