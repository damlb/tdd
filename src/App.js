import React, { useState, useEffect, createContext, useContext } from 'react';
import { supabase } from './supabaseClient';
import { Menu, X, Plus, Circle, CheckCircle, Calendar, Home, ChevronRight, ChevronDown, LogOut, AlertCircle, Share2, UserCheck } from 'lucide-react';

const AppContext = createContext();
const useApp = () => useContext(AppContext);

function Auth() {
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [message, setMessage] = useState('');

  const handleAuth = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      if (isSignUp) {
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        setMessage('Verifiez votre email pour confirmer votre inscription');
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      }
    } catch (error) {
      setMessage(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md">
        <h1 className="text-3xl font-bold text-gray-800 mb-2 text-center">Ma To-Do List</h1>
        <p className="text-gray-600 mb-8 text-center">Organisez votre vie simplement</p>

        <form onSubmit={handleAuth} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="vous@exemple.com"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Mot de passe</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="mot de passe"
              required
            />
          </div>

          {message && (
            <div className={`p-3 rounded-lg text-sm ${
              message.includes('Verifiez') ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
            }`}>
              {message}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50"
          >
            {loading ? 'Chargement...' : isSignUp ? 'Inscrire' : 'Se connecter'}
          </button>
        </form>

        <div className="mt-6 text-center">
          <button
            onClick={() => setIsSignUp(!isSignUp)}
            className="text-blue-600 hover:text-blue-700 font-medium text-sm"
          >
            {isSignUp ? 'Deja un compte ? Se connecter' : 'Pas de compte ? Inscrire'}
          </button>
        </div>
      </div>
    </div>
  );
}

function ErrorPopup({ message, onClose }) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg p-6 max-w-sm w-full shadow-xl">
        <div className="flex items-start gap-3 mb-4">
          <AlertCircle className="text-red-500 flex-shrink-0" size={24} />
          <div className="flex-1">
            <h3 className="font-semibold text-gray-900 mb-1">Erreur</h3>
            <p className="text-sm text-gray-600">{message}</p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="w-full bg-blue-600 text-white py-2 rounded-lg font-medium hover:bg-blue-700"
        >
          OK
        </button>
      </div>
    </div>
  );
}

function AppProvider({ children }) {
  const [user, setUser] = useState(null);
  const [themes, setThemes] = useState([]);
  const [projects, setProjects] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [checklistItems, setChecklistItems] = useState([]);
  const [projectShares, setProjectShares] = useState([]);
  const [activeTheme, setActiveTheme] = useState(null);
  const [view, setView] = useState('dashboard');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (user) {
      loadData();
    }
  }, [user]);

  const loadData = async () => {
    try {
      const { data: themesData } = await supabase
        .from('themes')
        .select('*')
        .order('created_at', { ascending: true });

      const { data: projectsData } = await supabase
        .from('projects')
        .select('*')
        .order('priority', { ascending: true });

      const { data: tasksData } = await supabase
        .from('tasks')
        .select('*')
        .order('created_at', { ascending: true });

      const { data: checklistData } = await supabase
        .from('checklist_items')
        .select('*')
        .order('position', { ascending: true });

      const { data: sharesData } = await supabase
        .from('project_shares')
        .select('*')
        .order('created_at', { ascending: false });

      setThemes(themesData || []);
      setProjects(projectsData || []);
      setTasks(tasksData || []);
      setChecklistItems(checklistData || []);
      setProjectShares(sharesData || []);

      if (themesData && themesData.length > 0 && !activeTheme) {
        setActiveTheme(themesData[0].id);
      }
    } catch (error) {
      console.error('Error loading data:', error);
    }
  };

  const addTheme = async (theme) => {
    const { data, error } = await supabase
      .from('themes')
      .insert([{ ...theme, user_id: user.id }])
      .select()
      .single();

    if (!error && data) {
      setThemes([...themes, data]);
      if (!activeTheme) setActiveTheme(data.id);
    }
  };

  const updateTheme = async (themeId, updates) => {
    const { data, error } = await supabase
      .from('themes')
      .update(updates)
      .eq('id', themeId)
      .select()
      .single();

    if (!error && data) {
      setThemes(themes.map(t => t.id === themeId ? data : t));
    }
  };

  const deleteTheme = async (themeId) => {
    const { error } = await supabase
      .from('themes')
      .delete()
      .eq('id', themeId);

    if (!error) {
      setThemes(themes.filter(t => t.id !== themeId));
      if (activeTheme === themeId) {
        setActiveTheme(themes[0]?.id || null);
      }
    }
  };

  const addProject = async (themeId, project) => {
    const { data, error } = await supabase
      .from('projects')
      .insert([{ ...project, theme_id: themeId, user_id: user.id, priority: project.priority || 2, is_checklist: project.is_checklist || false }])
      .select()
      .single();

    if (!error && data) {
      setProjects([...projects, data]);
    }
  };

  const updateProject = async (projectId, updates) => {
    const { data, error } = await supabase
      .from('projects')
      .update(updates)
      .eq('id', projectId)
      .select()
      .single();

    if (!error && data) {
      setProjects(projects.map(p => p.id === projectId ? data : p));
    }
  };

  const deleteProject = async (projectId) => {
    const { error } = await supabase
      .from('projects')
      .delete()
      .eq('id', projectId);

    if (!error) {
      setProjects(projects.filter(p => p.id !== projectId));
    }
  };

  const addTask = async (projectId, task) => {
    const taskData = {
      ...task,
      project_id: projectId,
      user_id: user.id,
      deadline: task.deadline || null
    };
    
    const { data, error } = await supabase
      .from('tasks')
      .insert([taskData])
      .select()
      .single();

    if (!error && data) {
      setTasks([...tasks, data]);
    }
  };

  const updateTask = async (taskId, updates) => {
    const { data, error } = await supabase
      .from('tasks')
      .update(updates)
      .eq('id', taskId)
      .select()
      .single();

    if (!error && data) {
      setTasks(tasks.map(t => t.id === taskId ? data : t));
    }
  };

  const toggleTask = async (taskId) => {
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;

    const { data, error } = await supabase
      .from('tasks')
      .update({ completed: !task.completed })
      .eq('id', taskId)
      .select()
      .single();

    if (!error && data) {
      setTasks(tasks.map(t => t.id === taskId ? data : t));
    }
  };

  const deleteTask = async (taskId) => {
    const { error } = await supabase
      .from('tasks')
      .delete()
      .eq('id', taskId);

    if (!error) {
      setTasks(tasks.filter(t => t.id !== taskId));
    }
  };

  const addChecklistItem = async (projectId, text) => {
    const maxPosition = checklistItems
      .filter(item => item.project_id === projectId)
      .reduce((max, item) => Math.max(max, item.position || 0), 0);

    const { data, error } = await supabase
      .from('checklist_items')
      .insert([{ 
        project_id: projectId, 
        user_id: user.id, 
        text,
        position: maxPosition + 1,
        completed: false 
      }])
      .select()
      .single();

    if (!error && data) {
      setChecklistItems([...checklistItems, data]);
    }
  };

  const toggleChecklistItem = async (itemId) => {
    const { error } = await supabase
      .from('checklist_items')
      .delete()
      .eq('id', itemId);

    if (!error) {
      setChecklistItems(checklistItems.filter(item => item.id !== itemId));
    }
  };

  const updateChecklistItem = async (itemId, newText) => {
    const { data, error } = await supabase
      .from('checklist_items')
      .update({ text: newText })
      .eq('id', itemId)
      .select()
      .single();

    if (!error && data) {
      setChecklistItems(checklistItems.map(item => item.id === itemId ? data : item));
    }
  };

  const reorderChecklistItems = async (projectId, items) => {
    const updates = items.map((item, index) => ({
      id: item.id,
      position: index
    }));

    for (const update of updates) {
      await supabase
        .from('checklist_items')
        .update({ position: update.position })
        .eq('id', update.id);
    }

    setChecklistItems(prevItems => 
      prevItems.map(item => {
        const update = updates.find(u => u.id === item.id);
        return update ? { ...item, position: update.position } : item;
      })
    );
  };

  const shareProject = async (projectId, email, accessLevel) => {
    // Vérifier la limite de 5 partages
    const existingShares = projectShares.filter(s => s.project_id === projectId && s.status !== 'revoked');
    if (existingShares.length >= 5) {
      throw new Error('Limite de 5 partages atteinte pour ce projet');
    }

    // Générer un token unique
    const inviteToken = Math.random().toString(36).substring(2) + Date.now().toString(36);

    const { data, error } = await supabase
      .from('project_shares')
      .insert([{
        project_id: projectId,
        owner_id: user.id,
        shared_with_email: email,
        access_level: accessLevel,
        invite_token: inviteToken,
        status: 'pending'
      }])
      .select()
      .single();

    if (!error && data) {
      setProjectShares([...projectShares, data]);
      return data;
    } else {
      throw error;
    }
  };

  const revokeShare = async (shareId) => {
    const { error } = await supabase
      .from('project_shares')
      .update({ status: 'revoked' })
      .eq('id', shareId);

    if (!error) {
      setProjectShares(projectShares.map(s => s.id === shareId ? { ...s, status: 'revoked' } : s));
    }
  };

  const getProjectShares = (projectId) => {
    return projectShares.filter(s => s.project_id === projectId && s.status !== 'revoked');
  };

  const getUrgentTasks = () => {
    const today = new Date().toISOString().split('T')[0];
    const todayDate = new Date(today);
    const nextWeek = new Date(todayDate.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    
    return tasks
      .filter(task => {
        if (task.completed) return false;
        if (!task.deadline) return false;
        return task.deadline <= nextWeek; // Inclut jusqu'à 7 jours dans le futur
      })
      .map(task => {
        const project = projects.find(p => p.id === task.project_id);
        const theme = themes.find(t => t.id === project?.theme_id);
        return {
          ...task,
          projectName: project?.name,
          themeName: theme?.name,
          themeColor: theme?.color
        };
      })
      .sort((a, b) => a.priority - b.priority);
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setThemes([]);
    setProjects([]);
    setTasks([]);
    setChecklistItems([]);
    setActiveTheme(null);
  };

  const value = {
    user,
    themes,
    projects,
    tasks,
    checklistItems,
    projectShares,
    activeTheme,
    setActiveTheme,
    view,
    setView,
    mobileMenuOpen,
    setMobileMenuOpen,
    addTheme,
    updateTheme,
    deleteTheme,
    addProject,
    updateProject,
    deleteProject,
    addTask,
    updateTask,
    toggleTask,
    deleteTask,
    addChecklistItem,
    toggleChecklistItem,
    updateChecklistItem,
    reorderChecklistItems,
    shareProject,
    revokeShare,
    getProjectShares,
    getUrgentTasks,
    signOut
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-lg text-gray-600">Chargement...</div>
      </div>
    );
  }

  if (!user) {
    return <Auth />;
  }

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

function MobileHeader() {
  const { setMobileMenuOpen, view } = useApp();
  const viewTitles = { dashboard: 'Dashboard', projects: 'Projets' };

  return (
    <div className="lg:hidden fixed top-0 left-0 right-0 bg-white border-b border-gray-200 z-40">
      <div className="flex items-center justify-between p-4">
        <button onClick={() => setMobileMenuOpen(true)} className="p-2 -ml-2">
          <Menu size={24} />
        </button>
        <h1 className="text-lg font-bold">{viewTitles[view]}</h1>
        <div className="w-10"></div>
      </div>
    </div>
  );
}

function MobileMenu() {
  const { mobileMenuOpen, setMobileMenuOpen, view, setView, themes, activeTheme, setActiveTheme, signOut, addTheme } = useApp();
  const [showThemeForm, setShowThemeForm] = useState(false);

  const handleThemeClick = (themeId) => {
    setActiveTheme(themeId);
    setView('projects');
    setMobileMenuOpen(false);
  };

  if (!mobileMenuOpen) return null;

  return (
    <>
      <div className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden" onClick={() => setMobileMenuOpen(false)} />
      <div className="fixed inset-y-0 left-0 w-80 max-w-[85vw] bg-white shadow-xl z-50 lg:hidden overflow-y-auto">
        <div className="p-4 border-b flex items-center justify-between">
          <h1 className="text-xl font-bold">Ma To-Do</h1>
          <button onClick={() => setMobileMenuOpen(false)} className="p-2">
            <X size={24} />
          </button>
        </div>

        <nav className="p-4 space-y-2">
          <button
            onClick={() => { setView('dashboard'); setMobileMenuOpen(false); }}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg ${
              view === 'dashboard' ? 'bg-blue-50 text-blue-600 font-medium' : 'text-gray-700'
            }`}
          >
            <Home size={20} />
            Dashboard
          </button>

          <button
            onClick={() => { setView('projects'); setMobileMenuOpen(false); }}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg ${
              view === 'projects' ? 'bg-blue-50 text-blue-600 font-medium' : 'text-gray-700'
            }`}
          >
            <CheckCircle size={20} />
            Projets
          </button>
        </nav>

        <div className="p-4 border-t">
          <div className="flex items-center justify-between mb-3 px-2">
            <h3 className="text-sm font-semibold text-gray-600">THEMES</h3>
            <button
              onClick={() => setShowThemeForm(true)}
              className="text-blue-600 hover:text-blue-700"
            >
              <Plus size={18} />
            </button>
          </div>
          <div className="space-y-1">
            {themes.map(theme => (
              <button
                key={theme.id}
                onClick={() => handleThemeClick(theme.id)}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg ${
                  activeTheme === theme.id ? 'bg-gray-100 font-medium' : ''
                }`}
              >
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: theme.color }} />
                <span className="text-sm">{theme.name}</span>
              </button>
            ))}
            {themes.length === 0 && (
              <p className="text-xs text-gray-500 text-center py-2">Aucun theme</p>
            )}
          </div>
        </div>

        <div className="p-4 border-t">
          <button
            onClick={signOut}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-red-600 hover:bg-red-50"
          >
            <LogOut size={20} />
            Deconnexion
          </button>
        </div>

        {showThemeForm && (
          <ThemeFormModal
            onClose={() => setShowThemeForm(false)}
            onSubmit={(theme) => {
              addTheme(theme);
              setShowThemeForm(false);
              setMobileMenuOpen(false);
            }}
          />
        )}
      </div>
    </>
  );
}

function TaskFormModalWithTheme({ themes, projects, onClose }) {
  const { addTask } = useApp();
  const [step, setStep] = useState(1);
  const [selectedTheme, setSelectedTheme] = useState('');
  const [selectedProject, setSelectedProject] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [deadline, setDeadline] = useState('');
  const [priority, setPriority] = useState(2);
  const [error, setError] = useState('');

  const filteredProjects = selectedTheme 
    ? projects.filter(p => p.theme_id === selectedTheme)
    : [];

  const handleNext = () => {
    if (step === 1 && !selectedTheme) {
      setError('Veuillez sélectionner un thème');
      return;
    }
    if (step === 2 && !selectedProject) {
      setError('Veuillez sélectionner un projet');
      return;
    }
    setError('');
    setStep(step + 1);
  };

  const handleSubmit = () => {
    if (!title.trim()) {
      setError('Le titre est obligatoire');
      return;
    }
    if (!priority) {
      setError('Veuillez sélectionner une priorité');
      return;
    }
    
    addTask(selectedProject, { title, description, deadline: deadline || null, priority, completed: false });
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-end lg:items-center justify-center z-50">
      <div className="bg-white rounded-t-2xl lg:rounded-lg w-full lg:max-w-md max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b p-4 flex items-center justify-between">
          <h2 className="text-lg font-bold">Nouvelle Tache - Étape {step}/3</h2>
          <button onClick={onClose} className="p-2">
            <X size={24} />
          </button>
        </div>
        
        <div className="p-4">
          {step === 1 && (
            <div>
              <label className="block text-sm font-medium mb-2">Sélectionner un thème</label>
              <div className="space-y-2">
                {themes.map(theme => (
                  <button
                    key={theme.id}
                    onClick={() => setSelectedTheme(theme.id)}
                    className={`w-full flex items-center gap-3 p-3 border rounded-lg ${
                      selectedTheme === theme.id ? 'border-blue-500 bg-blue-50' : 'border-gray-300'
                    }`}
                  >
                    <div className="w-4 h-4 rounded-full" style={{ backgroundColor: theme.color }} />
                    <span className="font-medium">{theme.name}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {step === 2 && (
            <div>
              <label className="block text-sm font-medium mb-2">Sélectionner un projet</label>
              <div className="space-y-2">
                {filteredProjects.map(project => (
                  <button
                    key={project.id}
                    onClick={() => setSelectedProject(project.id)}
                    className={`w-full flex items-center justify-between p-3 border rounded-lg ${
                      selectedProject === project.id ? 'border-blue-500 bg-blue-50' : 'border-gray-300'
                    }`}
                  >
                    <span className="font-medium">{project.name}</span>
                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                      project.priority === 1 ? 'bg-red-100 text-red-700' :
                      project.priority === 2 ? 'bg-orange-100 text-orange-700' :
                      'bg-green-100 text-green-700'
                    }`}>
                      P{project.priority}
                    </span>
                  </button>
                ))}
                {filteredProjects.length === 0 && (
                  <p className="text-sm text-gray-500 text-center py-4">Aucun projet dans ce thème</p>
                )}
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Titre *</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Ex: Finaliser les maquettes"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">Description</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows="2"
                  placeholder="Details..."
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">Date limite (optionnelle)</label>
                <input
                  type="date"
                  value={deadline}
                  onChange={(e) => setDeadline(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">Priorité *</label>
                <div className="grid grid-cols-3 gap-2">
                  {[1, 2, 3].map(p => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setPriority(p)}
                      className={`py-3 rounded-lg font-medium ${
                        priority === p
                          ? p === 1 ? 'bg-red-600 text-white' :
                            p === 2 ? 'bg-orange-600 text-white' :
                            'bg-green-600 text-white'
                          : 'bg-gray-100 text-gray-700'
                      }`}
                    >
                      P{p}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
          
          <div className="flex gap-2 mt-6">
            {step > 1 && (
              <button
                onClick={() => setStep(step - 1)}
                className="flex-1 px-4 py-3 bg-gray-100 rounded-lg font-medium"
              >
                Retour
              </button>
            )}
            <button
              onClick={step === 3 ? handleSubmit : handleNext}
              className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-lg font-medium"
            >
              {step === 3 ? 'Créer' : 'Suivant'}
            </button>
          </div>
        </div>
      </div>
      
      {error && <ErrorPopup message={error} onClose={() => setError('')} />}
    </div>
  );
}

function Dashboard() {
  const { getUrgentTasks, toggleTask, themes, projects, tasks } = useApp();
  const [showTaskForm, setShowTaskForm] = useState(false);
  const [showOverdue, setShowOverdue] = useState(true);
  const [showToday, setShowToday] = useState(false);
  const [showThisWeek, setShowThisWeek] = useState(false);
  const [showAllTasks, setShowAllTasks] = useState(false);
  const [filterTheme, setFilterTheme] = useState('all');
  const [filterTaskPriority, setFilterTaskPriority] = useState('all');
  const [sortByDate, setSortByDate] = useState('recent');
  
  const urgentTasks = getUrgentTasks();
  const today = new Date().toISOString().split('T')[0];
  const todayDate = new Date(today);
  const nextWeek = new Date(todayDate.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

  const overdueTasks = urgentTasks.filter(t => t.deadline < today);
  const todayTasks = urgentTasks.filter(t => t.deadline === today);
  const thisWeekTasks = urgentTasks.filter(t => t.deadline >= today && t.deadline <= nextWeek);
  
  const allActiveTasks = tasks
    .filter(t => !t.completed)
    .map(task => {
      const project = projects.find(p => p.id === task.project_id);
      const theme = themes.find(t => t.id === project?.theme_id);
      return {
        ...task,
        projectName: project?.name,
        themeName: theme?.name,
        themeColor: theme?.color,
        themeId: theme?.id
      };
    });
  
  let filteredAllTasks = allActiveTasks;
  
  if (filterTheme !== 'all') {
    filteredAllTasks = filteredAllTasks.filter(t => t.themeId === filterTheme);
  }
  
  if (filterTaskPriority !== 'all') {
    filteredAllTasks = filteredAllTasks.filter(t => t.priority === parseInt(filterTaskPriority));
  }
  
  filteredAllTasks = [...filteredAllTasks].sort((a, b) => {
    if (sortByDate === 'recent') {
      return new Date(b.created_at) - new Date(a.created_at);
    } else {
      return new Date(a.created_at) - new Date(b.created_at);
    }
  });

  return (
    <div className="p-4 pb-24">
      <div className="hidden lg:block mb-6">
        <h1 className="text-3xl font-bold mb-2">Dashboard</h1>
        <p className="text-gray-600">Vos taches urgentes</p>
      </div>

      <div className="grid grid-cols-2 gap-2 lg:gap-3 mb-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-2 lg:p-4">
          <div className="flex flex-col lg:flex-row items-center lg:items-center justify-between">
            <div className="text-center lg:text-left w-full">
              <p className="text-xs lg:text-sm text-red-600 font-medium hidden lg:block">En retard</p>
              <p className="text-xl lg:text-2xl font-bold text-red-700">{overdueTasks.length}</p>
              <p className="text-xs text-red-600 lg:hidden">En retard</p>
            </div>
            <Calendar className="text-red-400 hidden lg:block" size={28} />
          </div>
        </div>
        
        <div className="bg-orange-50 border border-orange-200 rounded-lg p-2 lg:p-4">
          <div className="flex flex-col lg:flex-row items-center lg:items-center justify-between">
            <div className="text-center lg:text-left w-full">
              <p className="text-xs lg:text-sm text-orange-600 font-medium hidden lg:block">Aujourd hui</p>
              <p className="text-xl lg:text-2xl font-bold text-orange-700">{todayTasks.length}</p>
              <p className="text-xs text-orange-600 lg:hidden">Aujourd'hui</p>
            </div>
            <CheckCircle className="text-orange-400 hidden lg:block" size={28} />
          </div>
        </div>
      </div>

      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setShowTaskForm(true)}
          className="hidden lg:flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
        >
          <Plus size={20} />
          Nouvelle Tache
        </button>

        <button
          onClick={() => setShowAllTasks(!showAllTasks)}
          className="hidden lg:flex items-center gap-2 border border-gray-300 px-4 py-2 rounded-lg hover:bg-gray-50"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
          {showAllTasks ? 'Masquer toutes les tâches' : 'Toutes les tâches'}
        </button>
      </div>

      <button
        onClick={() => setShowTaskForm(true)}
        className="lg:hidden fixed bottom-20 right-4 w-14 h-14 bg-blue-600 text-white rounded-full shadow-lg flex items-center justify-center z-30"
      >
        <Plus size={24} />
      </button>

      {!showAllTasks ? (
        <div className="space-y-4">
          <div className="bg-white rounded-lg shadow-sm border">
            <button
              onClick={() => setShowOverdue(!showOverdue)}
              className="w-full p-4 flex items-center justify-between hover:bg-gray-50"
            >
              <div className="flex items-center gap-3">
                {showOverdue ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
                <h2 className="text-lg font-semibold text-red-600">En retard ({overdueTasks.length})</h2>
              </div>
            </button>
            
            {showOverdue && (
              <div className="border-t divide-y">
                {overdueTasks.length === 0 ? (
                  <div className="p-8 text-center text-gray-500">
                    <CheckCircle className="mx-auto mb-3 text-green-400" size={48} />
                    <p className="font-medium">Aucune tache en retard</p>
                    <p className="text-sm">Excellent travail !</p>
                  </div>
                ) : (
                  overdueTasks.map(task => (
                    <TaskItemDashboard key={task.id} task={task} toggleTask={toggleTask} />
                  ))
                )}
              </div>
            )}
          </div>

          <div className="bg-white rounded-lg shadow-sm border">
            <button
              onClick={() => setShowToday(!showToday)}
              className="w-full p-4 flex items-center justify-between hover:bg-gray-50"
            >
              <div className="flex items-center gap-3">
                {showToday ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
                <h2 className="text-lg font-semibold text-orange-600">Aujourd'hui ({todayTasks.length})</h2>
              </div>
            </button>
            
            {showToday && (
              <div className="border-t divide-y">
                {todayTasks.length === 0 ? (
                  <div className="p-8 text-center text-gray-500">
                    <Calendar className="mx-auto mb-3 text-gray-400" size={48} />
                    <p className="font-medium">Aucune tache pour aujourd'hui</p>
                    <p className="text-sm">Profitez de votre journee !</p>
                  </div>
                ) : (
                  todayTasks.map(task => (
                    <TaskItemDashboard key={task.id} task={task} toggleTask={toggleTask} />
                  ))
                )}
              </div>
            )}
          </div>

          <div className="bg-white rounded-lg shadow-sm border">
            <button
              onClick={() => setShowThisWeek(!showThisWeek)}
              className="w-full p-4 flex items-center justify-between hover:bg-gray-50"
            >
              <div className="flex items-center gap-3">
                {showThisWeek ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
                <h2 className="text-lg font-semibold text-blue-600">Cette semaine ({thisWeekTasks.length})</h2>
              </div>
            </button>
            
            {showThisWeek && (
              <div className="border-t divide-y">
                {thisWeekTasks.length === 0 ? (
                  <div className="p-8 text-center text-gray-500">
                    <Calendar className="mx-auto mb-3 text-gray-400" size={48} />
                    <p className="font-medium">Aucune tache pour cette semaine</p>
                    <p className="text-sm">Tout va bien !</p>
                  </div>
                ) : (
                  thisWeekTasks.map(task => (
                    <TaskItemDashboard key={task.id} task={task} toggleTask={toggleTask} />
                  ))
                )}
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-sm border">
          <div className="p-4 border-b">
            <h2 className="text-lg font-semibold mb-4">Toutes les tâches actives ({filteredAllTasks.length})</h2>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Filtrer par thème</label>
                <select
                  value={filterTheme}
                  onChange={(e) => setFilterTheme(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                >
                  <option value="all">Tous les thèmes</option>
                  {themes.map(theme => (
                    <option key={theme.id} value={theme.id}>{theme.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Filtrer par priorité</label>
                <select
                  value={filterTaskPriority}
                  onChange={(e) => setFilterTaskPriority(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                >
                  <option value="all">Toutes les priorités</option>
                  <option value="1">P1 uniquement</option>
                  <option value="2">P2 uniquement</option>
                  <option value="3">P3 uniquement</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Trier par date</label>
                <select
                  value={sortByDate}
                  onChange={(e) => setSortByDate(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                >
                  <option value="recent">Plus récent</option>
                  <option value="oldest">Plus ancien</option>
                </select>
              </div>
            </div>
          </div>

          <div className="divide-y max-h-[600px] overflow-y-auto">
            {filteredAllTasks.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                <CheckCircle className="mx-auto mb-3 text-gray-400" size={48} />
                <p className="font-medium">Aucune tâche active</p>
                <p className="text-sm">Créez votre première tâche !</p>
              </div>
            ) : (
              filteredAllTasks.map(task => (
                <TaskItemDashboard key={task.id} task={task} toggleTask={toggleTask} />
              ))
            )}
          </div>
        </div>
      )}

      {showTaskForm && (
        <TaskFormModalWithTheme
          themes={themes}
          projects={projects}
          onClose={() => setShowTaskForm(false)}
        />
      )}
    </div>
  );
}

function TaskItemDashboard({ task, toggleTask }) {
  return (
    <div className="p-4">
      <div className="flex items-start gap-3">
        <button onClick={() => toggleTask(task.id)} className="mt-1">
          {task.completed ? (
            <CheckCircle className="text-green-500" size={20} />
          ) : (
            <Circle className="text-gray-400" size={20} />
          )}
        </button>
        
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2 mb-1">
            <h3 className={`font-medium text-sm ${task.completed ? 'line-through text-gray-400' : ''}`}>
              {task.projectName && (
                <span className="text-gray-600">{task.projectName} â†’ </span>
              )}
              {task.title}
            </h3>
            {task.themeName && (
              <span
                className="px-2 py-0.5 rounded text-xs font-medium"
                style={{ backgroundColor: task.themeColor + '20', color: task.themeColor }}
              >
                {task.themeName}
              </span>
            )}
            <span className={`px-2 py-0.5 rounded text-xs font-medium ${
              task.priority === 1 ? 'bg-red-100 text-red-700' :
              task.priority === 2 ? 'bg-orange-100 text-orange-700' :
              'bg-green-100 text-green-700'
            }`}>
              P{task.priority}
            </span>
          </div>
          
          {task.description && (
            <p className="text-sm text-gray-500 mb-2">{task.description}</p>
          )}
          
          {task.deadline && (
            <div className="flex items-center gap-2 text-sm">
              <span className="flex items-center gap-1 text-gray-500">
                <Calendar size={14} />
                {task.deadline}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function ShareProjectModal({ project, onClose }) {
  const { shareProject, revokeShare, getProjectShares, projectShares } = useApp();
  const [email, setEmail] = useState('');
  const [accessLevel, setAccessLevel] = useState('read');
  const [isLoading, setIsLoading] = useState(false);
  const [shares, setShares] = useState([]);

  useEffect(() => {
    if (project) {
      const projectSharesList = getProjectShares(project.id);
      setShares(projectSharesList);
    }
  }, [project, projectShares]);

  const handleShare = async (e) => {
    e.preventDefault();
    if (!email.trim()) return;

    // Vérifier la limite de 5 partages
    if (shares.length >= 5) {
      window.alert('Vous avez atteint la limite de 5 personnes par projet');
      return;
    }

    setIsLoading(true);
    try {
      await shareProject(project.id, email.trim(), accessLevel);
      setEmail('');
      setAccessLevel('read');
      
      // Rafraîchir la liste
      const updatedShares = getProjectShares(project.id);
      setShares(updatedShares);
    } catch (error) {
      window.alert('Erreur lors du partage : ' + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRevoke = async (shareId) => {
    if (!window.confirm('Voulez-vous vraiment révoquer cet accès ?')) return;
    
    setIsLoading(true);
    try {
      await revokeShare(shareId);
      
      // Rafraîchir la liste
      const updatedShares = getProjectShares(project.id);
      setShares(updatedShares);
    } catch (error) {
      window.alert('Erreur lors de la révocation : ' + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    const badges = {
      pending: { text: 'En attente', color: 'bg-yellow-100 text-yellow-800' },
      active: { text: 'Actif', color: 'bg-green-100 text-green-800' },
      revoked: { text: 'Révoqué', color: 'bg-red-100 text-red-800' }
    };
    return badges[status] || badges.pending;
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        <div className="p-6 border-b border-gray-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Share2 className="h-6 w-6 text-blue-600" />
            <h2 className="text-xl font-semibold text-gray-900">
              Partager : {project.name}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded"
          >
            <X className="h-6 w-6 text-gray-500" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Formulaire d'ajout */}
          <form onSubmit={handleShare} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email de la personne à inviter
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="email@exemple.com"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
                disabled={isLoading}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Niveau d'accès
              </label>
              <select
                value={accessLevel}
                onChange={(e) => setAccessLevel(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={isLoading}
              >
                <option value="read">Lecture seule</option>
                <option value="edit">Modifier les tâches</option>
              </select>
              <p className="text-xs text-gray-500 mt-1">
                {accessLevel === 'read' 
                  ? 'La personne pourra voir le projet et les tâches' 
                  : 'La personne pourra modifier les tâches (mais pas supprimer le projet)'}
              </p>
            </div>

            <button
              type="submit"
              disabled={isLoading || shares.length >= 5}
              className="w-full bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Envoi...' : shares.length >= 5 ? 'Limite atteinte (5 personnes max)' : 'Envoyer l\'invitation'}
            </button>
          </form>

          {/* Liste des partages existants */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <UserCheck className="h-5 w-5" />
              Personnes ayant accès ({shares.length}/5)
            </h3>

            {shares.length === 0 ? (
              <p className="text-gray-500 text-sm italic">
                Aucun partage pour le moment
              </p>
            ) : (
              <div className="space-y-2">
                {shares.map(share => {
                  const badge = getStatusBadge(share.status);
                  return (
                    <div
                      key={share.id}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-gray-900">
                            {share.shared_with_email}
                          </span>
                          <span className={`text-xs px-2 py-1 rounded-full ${badge.color}`}>
                            {badge.text}
                          </span>
                        </div>
                        <div className="text-sm text-gray-600 mt-1">
                          Accès : {share.access_level === 'read' ? 'Lecture seule' : 'Modification'}
                        </div>
                        {share.accepted_at && (
                          <div className="text-xs text-gray-500 mt-1">
                            Accepté le {new Date(share.accepted_at).toLocaleDateString()}
                          </div>
                        )}
                      </div>

                      {share.status !== 'revoked' && (
                        <button
                          onClick={() => handleRevoke(share.id)}
                          disabled={isLoading}
                          className="ml-4 p-2 text-red-600 hover:bg-red-50 rounded disabled:opacity-50"
                          title="Révoquer l'accès"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        <div className="p-6 border-t border-gray-200">
          <button
            onClick={onClose}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
}

function Projects() {
  const { themes, projects, tasks, checklistItems, projectShares, activeTheme, setActiveTheme, addProject, updateProject, deleteProject, addTask, updateTask, toggleTask, deleteTask, addChecklistItem, toggleChecklistItem, updateChecklistItem, reorderChecklistItems, shareProject, revokeShare, getProjectShares } = useApp();
  const [expandedPriorities, setExpandedPriorities] = useState({ 1: true, 2: false, 3: false });
  const [expandedProjects, setExpandedProjects] = useState({});
  const [showProjectForm, setShowProjectForm] = useState(false);
  const [showTaskForm, setShowTaskForm] = useState(false);
  const [editingProject, setEditingProject] = useState(null);
  const [editingTask, setEditingTask] = useState(null);
  const [activeProject, setActiveProject] = useState(null);
  const [sharingProject, setSharingProject] = useState(null);
  const [filterTheme, setFilterTheme] = useState('all');
  const [filterTaskPriority, setFilterTaskPriority] = useState('all');
  const [filterProjectPriority, setFilterProjectPriority] = useState('all');
  const [filterStatus, setFilterStatus] = useState('active');
  const [sortBy, setSortBy] = useState('name');
  const [searchText, setSearchText] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  
  useEffect(() => {
    if (activeTheme) {
      setFilterTheme(activeTheme);
    }
  }, [activeTheme]);
  
  const filteredTasks = tasks.filter(t => {
    if (filterStatus === 'active' && t.completed) return false;
    if (filterStatus === 'completed' && !t.completed) return false;
    return true;
  });
  
  const activeTasks = tasks.filter(t => !t.completed);
  const completedTasks = tasks.filter(t => t.completed);
  
  let filteredProjects = projects;
  
  if (filterTheme !== 'all') {
    filteredProjects = filteredProjects.filter(p => p.theme_id === filterTheme);
  }
  
  if (searchText.trim()) {
    filteredProjects = filteredProjects.filter(p => 
      p.name.toLowerCase().includes(searchText.toLowerCase()) ||
      p.description?.toLowerCase().includes(searchText.toLowerCase())
    );
  }
  
  filteredProjects = [...filteredProjects].sort((a, b) => {
    if (sortBy === 'name') return a.name.localeCompare(b.name);
    if (sortBy === 'theme') {
      const themeA = themes.find(t => t.id === a.theme_id)?.name || '';
      const themeB = themes.find(t => t.id === b.theme_id)?.name || '';
      return themeA.localeCompare(themeB);
    }
    return 0;
  });
  
  const projectsByPriority = {
    1: filteredProjects.filter(p => p.priority === 1),
    2: filteredProjects.filter(p => p.priority === 2),
    3: filteredProjects.filter(p => p.priority === 3)
  };
  
  const togglePriority = (priority) => {
    setExpandedPriorities(prev => ({ ...prev, [priority]: !prev[priority] }));
  };
  
  const toggleProject = (projectId) => {
    setExpandedProjects(prev => ({ ...prev, [projectId]: !prev[projectId] }));
  };

  const filterTasksByPriority = (tasksList) => {
    if (filterTaskPriority === 'all') return tasksList;
    return tasksList.filter(t => t.priority === parseInt(filterTaskPriority));
  };

  return (
    <div className="p-4 pb-24">
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold mb-2">
              {activeTheme && filterTheme !== 'all' 
                ? themes.find(t => t.id === activeTheme)?.name || 'Projets'
                : 'Projets'}
            </h1>
            <div className="flex gap-4 text-sm">
              <button
                onClick={() => setFilterStatus('active')}
                className={`pb-1 ${filterStatus === 'active' ? 'text-blue-600 border-b-2 border-blue-600 font-medium' : 'text-gray-600'}`}
              >
                Actives ({activeTasks.length})
              </button>
              <button
                onClick={() => setFilterStatus('completed')}
                className={`pb-1 ${filterStatus === 'completed' ? 'text-blue-600 border-b-2 border-blue-600 font-medium' : 'text-gray-600'}`}
              >
                Terminees ({completedTasks.length})
              </button>
              <button
                onClick={() => setFilterStatus('all')}
                className={`pb-1 ${filterStatus === 'all' ? 'text-blue-600 border-b-2 border-blue-600 font-medium' : 'text-gray-600'}`}
              >
                Toutes ({tasks.length})
              </button>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
              </svg>
              Filtres
            </button>
            <button
              onClick={() => setShowProjectForm(true)}
              className="hidden lg:flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
            >
              <Plus size={20} />
              Nouveau Projet
            </button>
          </div>
        </div>

        {showFilters && (
          <div className="space-y-3 mb-4 p-4 bg-gray-50 rounded-lg border">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Rechercher un projet</label>
              <input
                type="text"
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                placeholder="Nom du projet..."
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Theme</label>
                <select
                  value={filterTheme}
                  onChange={(e) => {
                    setFilterTheme(e.target.value);
                    setActiveTheme(e.target.value === 'all' ? null : e.target.value);
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                >
                  <option value="all">Tous les themes</option>
                  {themes.map(theme => (
                    <option key={theme.id} value={theme.id}>{theme.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Priorité des tâches</label>
                <select
                  value={filterTaskPriority}
                  onChange={(e) => setFilterTaskPriority(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                >
                  <option value="all">Toutes les priorites</option>
                  <option value="1">Priorite 1 (Haute)</option>
                  <option value="2">Priorite 2 (Moyenne)</option>
                  <option value="3">Priorite 3 (Basse)</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Priorité des projets</label>
                <select
                  value={filterProjectPriority}
                  onChange={(e) => setFilterProjectPriority(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                >
                  <option value="all">Toutes les priorités</option>
                  <option value="1">P1 uniquement</option>
                  <option value="2">P2 uniquement</option>
                  <option value="3">P3 uniquement</option>
                </select>
              </div>
            </div>
          </div>
        )}
      </div>

      <button
        onClick={() => setShowProjectForm(true)}
        className="lg:hidden fixed bottom-20 right-4 w-14 h-14 bg-blue-600 text-white rounded-full shadow-lg flex items-center justify-center z-30"
      >
        <Plus size={24} />
      </button>

      <div className="space-y-3">
        {[1, 2, 3]
          .filter(priority => filterProjectPriority === 'all' || parseInt(filterProjectPriority) === priority)
          .map(priority => (
          <div key={priority} className="bg-white rounded-lg shadow-sm border">
            <button
              onClick={() => togglePriority(priority)}
              className="w-full p-4 flex items-center justify-between hover:bg-gray-50"
            >
              <div className="flex items-center gap-3">
                {expandedPriorities[priority] ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
                <h2 className={`text-lg font-semibold ${
                  priority === 1 ? 'text-red-600' :
                  priority === 2 ? 'text-orange-600' :
                  'text-green-600'
                }`}>
                  P{priority} ({projectsByPriority[priority].length})
                </h2>
              </div>
            </button>

            {expandedPriorities[priority] && (
              <div className="border-t">
                {projectsByPriority[priority].length === 0 ? (
                  <div className="p-8 text-center text-gray-500">
                    <p className="text-sm">Aucun projet de priorité {priority}</p>
                  </div>
                ) : (
                  <div className="divide-y">
                    {projectsByPriority[priority].map(project => {
                      let projectTasks = filteredTasks.filter(t => t.project_id === project.id);
                      projectTasks = filterTasksByPriority(projectTasks);
                      
                      const projectTheme = themes.find(t => t.id === project.theme_id);
                      
                      return (
                        <div key={project.id} className="p-4">
                          <div className="flex items-center justify-between group">
                            <div 
                              className="flex items-center gap-3 flex-1 min-w-0 cursor-pointer"
                              onClick={() => toggleProject(project.id)}
                            >
                              {expandedProjects[project.id] ? 
                                <ChevronDown size={18} className="flex-shrink-0" /> : 
                                <ChevronRight size={18} className="flex-shrink-0" />
                              }
                              <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                  <h3 className="font-semibold text-sm truncate">{project.name}</h3>
                                  {projectTheme && (
                                    <span
                                      className="px-2 py-1 rounded text-xs font-medium whitespace-nowrap flex items-center gap-1"
                                      style={{ backgroundColor: projectTheme.color + '20', color: projectTheme.color }}
                                    >
                                      <div 
                                        className="w-2 h-2 rounded-full" 
                                        style={{ backgroundColor: projectTheme.color }}
                                      />
                                      {projectTheme.name}
                                    </span>
                                  )}
                                </div>
                                <p className="text-xs text-gray-500 truncate">{project.description}</p>
                              </div>
                            </div>
                            
                            <div className="flex items-center gap-2">
                              <div className="text-sm text-gray-600 flex-shrink-0">
                                {projectTasks.length} tache{projectTasks.length > 1 ? 's' : ''}
                              </div>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setEditingProject(project);
                                }}
                                className="opacity-0 group-hover:opacity-100 p-2 hover:bg-gray-200 rounded transition-opacity"
                              >
                                <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                                </svg>
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSharingProject(project);
                                }}
                                className="opacity-0 group-hover:opacity-100 p-2 hover:bg-gray-200 rounded transition-opacity"
                                title="Partager le projet"
                              >
                                <Share2 className="w-4 h-4 text-gray-600" />
                              </button>
                            </div>
                          </div>

                          {expandedProjects[project.id] && (
                            <div className="mt-4 pl-7 border-l-2 border-gray-200">
                              <ChecklistSection 
                                project={project}
                                checklistItems={checklistItems}
                                addChecklistItem={addChecklistItem}
                                toggleChecklistItem={toggleChecklistItem}
                                updateChecklistItem={updateChecklistItem}
                                reorderChecklistItems={reorderChecklistItems}
                              />

                              <div className="flex items-center justify-between mb-3">
                                <h4 className="font-medium text-sm">
                                  {filterStatus === 'completed' ? 'Taches terminees' : 
                                   filterStatus === 'active' ? 'Taches actives' : 'Toutes les taches'}
                                </h4>
                                {filterStatus !== 'completed' && (
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setActiveProject(project.id);
                                      setShowTaskForm(true);
                                    }}
                                    className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700"
                                  >
                                    <Plus size={16} />
                                    Ajouter
                                  </button>
                                )}
                              </div>

                              <div className="space-y-2">
                                {projectTasks
                                  .sort((a, b) => a.priority - b.priority)
                                  .map(task => (
                                    <TaskItem 
                                      key={task.id} 
                                      task={task} 
                                      showCompleted={filterStatus === 'completed'}
                                      onDelete={() => deleteTask(task.id)}
                                      onEdit={() => setEditingTask(task)}
                                      onToggle={() => toggleTask(task.id)}
                                    />
                                  ))}
                                
                                {projectTasks.length === 0 && (
                                  <p className="text-sm text-gray-500 text-center py-4">
                                    {filterTaskPriority !== 'all' 
                                      ? `Aucune tache avec cette priorite`
                                      : filterStatus === 'completed' ? 'Aucune tache terminee' : 
                                        filterStatus === 'active' ? 'Aucune tache active' : 'Aucune tache'
                                    }
                                  </p>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      {showProjectForm && (
        <ProjectFormModal
          themes={themes}
          defaultTheme={filterTheme !== 'all' ? filterTheme : themes[0]?.id}
          onClose={() => setShowProjectForm(false)}
          onSubmit={(project) => {
            addProject(project.themeId, { name: project.name, description: project.description, priority: project.priority, is_checklist: project.is_checklist });
            setShowProjectForm(false);
          }}
        />
      )}

      {editingProject && (
        <ProjectFormModal
          themes={themes}
          project={editingProject}
          onClose={() => setEditingProject(null)}
          onSubmit={(project) => {
            updateProject(editingProject.id, { 
              name: project.name, 
              description: project.description,
              theme_id: project.themeId,
              priority: project.priority,
              is_checklist: project.is_checklist
            });
            setEditingProject(null);
          }}
          onDelete={() => {
            if (window.confirm('Supprimer ce projet ? Toutes les taches seront aussi supprimees.')) {
              deleteProject(editingProject.id);
              setEditingProject(null);
            }
          }}
        />
      )}

      {sharingProject && (
        <ShareProjectModal
          project={sharingProject}
          onClose={() => setSharingProject(null)}
        />
      )}

      {showTaskForm && (
        <TaskFormModal
          onClose={() => { setShowTaskForm(false); setActiveProject(null); }}
          onSubmit={(task) => {
            if (activeProject) {
              addTask(activeProject, task);
            }
            setShowTaskForm(false);
            setActiveProject(null);
          }}
        />
      )}

      {editingTask && (
        <TaskFormModal
          task={editingTask}
          onClose={() => setEditingTask(null)}
          onSubmit={(task) => {
            updateTask(editingTask.id, task);
            setEditingTask(null);
          }}
          onDelete={() => {
            if (window.confirm('Supprimer definitivement cette tache ?')) {
              deleteTask(editingTask.id);
              setEditingTask(null);
            }
          }}
        />
      )}
    </div>
  );
}

function TaskItem({ task, showCompleted, onDelete, onEdit, onToggle }) {
  return (
    <div className="bg-white p-3 rounded border group hover:bg-gray-50">
      <div className="flex items-start gap-2">
        <button onClick={onToggle} className="mt-0.5">
          {task.completed ? (
            <CheckCircle className="text-green-500" size={18} />
          ) : (
            <Circle className="text-gray-400" size={18} />
          )}
        </button>
        
        <div 
          className="flex-1 min-w-0 cursor-pointer"
          onClick={onEdit}
        >
          <div className="flex flex-wrap items-center gap-2 mb-1">
            <h4 className={`font-medium text-xs ${task.completed ? 'line-through text-gray-400' : ''}`}>
              {task.title}
            </h4>
            <span className={`px-2 py-0.5 rounded text-xs font-medium ${
              task.priority === 1 ? 'bg-red-100 text-red-700' :
              task.priority === 2 ? 'bg-orange-100 text-orange-700' :
              'bg-green-100 text-green-700'
            }`}>
              P{task.priority}
            </span>
          </div>
          
          {task.description && (
            <p className="text-xs text-gray-500 mb-1">{task.description}</p>
          )}
          
          {task.deadline ? (
            <p className="text-xs text-gray-500 flex items-center gap-1">
              <Calendar size={12} />
              {task.deadline}
            </p>
          ) : (
            <p className="text-xs text-gray-400 italic">Pas de deadline</p>
          )}
        </div>

        {showCompleted && (
          <button
            onClick={() => {
              if (window.confirm('Supprimer definitivement cette tache ?')) {
                onDelete();
              }
            }}
            className="p-2 text-red-600 hover:bg-red-50 rounded"
            title="Supprimer"
          >
            <X size={16} />
          </button>
        )}
      </div>
    </div>
  );
}

function ChecklistSection({ project, checklistItems, addChecklistItem, toggleChecklistItem, updateChecklistItem, reorderChecklistItems }) {
  const [newItemText, setNewItemText] = useState('');
  const [draggedItem, setDraggedItem] = useState(null);
  const [draggedOverItem, setDraggedOverItem] = useState(null);
  const [editingItemId, setEditingItemId] = useState(null);
  const [editingText, setEditingText] = useState('');

  const projectItems = checklistItems
    .filter(item => item.project_id === project.id)
    .sort((a, b) => (a.position || 0) - (b.position || 0));

  const handleAddItem = () => {
    if (newItemText.trim()) {
      addChecklistItem(project.id, newItemText.trim());
      setNewItemText('');
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleAddItem();
    }
  };

  const handleStartEdit = (item) => {
    setEditingItemId(item.id);
    setEditingText(item.text);
  };

  const handleSaveEdit = (itemId) => {
    if (editingText.trim()) {
      updateChecklistItem(itemId, editingText.trim());
    }
    setEditingItemId(null);
    setEditingText('');
  };

  const handleKeyPressEdit = (e, itemId) => {
    if (e.key === 'Enter') {
      handleSaveEdit(itemId);
    } else if (e.key === 'Escape') {
      setEditingItemId(null);
      setEditingText('');
    }
  };

  const handleDragStart = (e, item) => {
    setDraggedItem(item);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/html', e.target);
    e.target.style.opacity = '0.5';
  };

  const handleDragEnd = (e) => {
    e.target.style.opacity = '1';
    setDraggedItem(null);
    setDraggedOverItem(null);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDragEnter = (e, item) => {
    if (draggedItem && draggedItem.id !== item.id) {
      setDraggedOverItem(item);
    }
  };

  const handleDrop = (e, dropTarget) => {
    e.preventDefault();
    
    if (!draggedItem || draggedItem.id === dropTarget.id) return;

    const items = [...projectItems];
    const draggedIndex = items.findIndex(item => item.id === draggedItem.id);
    const targetIndex = items.findIndex(item => item.id === dropTarget.id);

    items.splice(draggedIndex, 1);
    items.splice(targetIndex, 0, draggedItem);

    reorderChecklistItems(project.id, items);
  };

  if (!project.is_checklist) return null;

  return (
    <div className="mb-4 pb-4 border-b">
      <div className="flex items-center justify-between mb-3">
        <h4 className="font-medium text-sm">Liste de courses</h4>
        <span className="text-xs text-gray-500">{projectItems.length} élément{projectItems.length > 1 ? 's' : ''}</span>
      </div>

      {projectItems.length > 0 && (
        <div className="space-y-2 mb-3">
          {projectItems.map((item) => (
            <div
              key={item.id}
              draggable={editingItemId !== item.id}
              onDragStart={(e) => handleDragStart(e, item)}
              onDragEnd={handleDragEnd}
              onDragOver={handleDragOver}
              onDragEnter={(e) => handleDragEnter(e, item)}
              onDrop={(e) => handleDrop(e, item)}
              className={`flex items-center gap-3 p-3 bg-white border rounded-lg ${
                editingItemId === item.id ? '' : 'cursor-move hover:bg-gray-50'
              } transition-all ${
                draggedOverItem?.id === item.id ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
              }`}
            >
              <div className="flex items-center gap-3 flex-1">
                {editingItemId !== item.id && (
                  <div className="text-gray-400 cursor-grab active:cursor-grabbing">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8h16M4 16h16" />
                    </svg>
                  </div>
                )}
                
                <button
                  onClick={() => toggleChecklistItem(item.id)}
                  className="flex-shrink-0"
                >
                  <Circle className="text-gray-400 hover:text-blue-500" size={20} />
                </button>
                
                {editingItemId === item.id ? (
                  <input
                    type="text"
                    value={editingText}
                    onChange={(e) => setEditingText(e.target.value)}
                    onKeyDown={(e) => handleKeyPressEdit(e, item.id)}
                    onBlur={() => handleSaveEdit(item.id)}
                    autoFocus
                    className="flex-1 px-2 py-1 text-sm border border-blue-500 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                ) : (
                  <span 
                    onClick={() => handleStartEdit(item)}
                    className="text-sm text-gray-700 flex-1 cursor-text hover:bg-gray-100 px-2 py-1 rounded"
                  >
                    {item.text}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="flex gap-2">
        <input
          type="text"
          value={newItemText}
          onChange={(e) => setNewItemText(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="Ajouter un élément..."
          className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <button
          onClick={handleAddItem}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 flex items-center gap-1"
        >
          <Plus size={16} />
          Ajouter
        </button>
      </div>
    </div>
  );
}

function ProjectFormModal({ themes, project, defaultTheme, onClose, onSubmit, onDelete }) {
  const [name, setName] = useState(project?.name || '');
  const [description, setDescription] = useState(project?.description || '');
  const [themeId, setThemeId] = useState(project?.theme_id || defaultTheme || themes[0]?.id || '');
  const [priority, setPriority] = useState(project?.priority || 2);
  const [isChecklist, setIsChecklist] = useState(project?.is_checklist || false);
  const [error, setError] = useState('');

  const handleSubmit = () => {
    if (!name.trim()) {
      setError('Le nom du projet est obligatoire');
      return;
    }
    if (!themeId) {
      setError('Veuillez sélectionner un thème');
      return;
    }
    if (!priority) {
      setError('Veuillez sélectionner une priorité');
      return;
    }
    
    onSubmit({ name, description, themeId, priority, is_checklist: isChecklist });
  };

  return (
    <>
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-end lg:items-center justify-center z-50">
        <div className="bg-white rounded-t-2xl lg:rounded-lg w-full lg:max-w-md max-h-[90vh] overflow-y-auto">
          <div className="sticky top-0 bg-white border-b p-4 flex items-center justify-between">
            <h2 className="text-lg font-bold">{project ? 'Modifier le Projet' : 'Nouveau Projet'}</h2>
            <button onClick={onClose} className="p-2">
              <X size={24} />
            </button>
          </div>
          
          <div className="p-4">
            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">Theme *</label>
              <select
                value={themeId}
                onChange={(e) => setThemeId(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              >
                <option value="">Choisir un theme</option>
                {themes.map(theme => (
                  <option key={theme.id} value={theme.id}>
                    {theme.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">Nom du projet *</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Ex: Site Web Client A"
              />
            </div>
            
            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">Description</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows="3"
                placeholder="Decrivez votre projet..."
              />
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">Priorité *</label>
              <div className="grid grid-cols-3 gap-2">
                {[1, 2, 3].map(p => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setPriority(p)}
                    className={`py-3 rounded-lg font-medium ${
                      priority === p
                        ? p === 1 ? 'bg-red-600 text-white' :
                          p === 2 ? 'bg-orange-600 text-white' :
                          'bg-green-600 text-white'
                        : 'bg-gray-100 text-gray-700'
                    }`}
                  >
                    P{p}
                  </button>
                ))}
              </div>
            </div>

            <div className="mb-4">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isChecklist}
                  onChange={(e) => setIsChecklist(e.target.checked)}
                  className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                />
                <span className="text-sm font-medium text-gray-700">Ajouter liste cochable</span>
              </label>
              <p className="text-xs text-gray-500 mt-1 ml-8">Créer une liste de courses par exemple</p>
            </div>
            
            <div className="flex gap-2">
              {project && onDelete && (
                <button
                  onClick={onDelete}
                  className="px-4 py-3 bg-red-50 text-red-600 rounded-lg font-medium hover:bg-red-100"
                >
                  Supprimer
                </button>
              )}
              <button onClick={onClose} className="flex-1 px-4 py-3 bg-gray-100 rounded-lg font-medium">
                Annuler
              </button>
              <button onClick={handleSubmit} className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-lg font-medium">
                {project ? 'Modifier' : 'Creer'}
              </button>
            </div>
          </div>
        </div>
      </div>
      
      {error && <ErrorPopup message={error} onClose={() => setError('')} />}
    </>
  );
}

function TaskFormModal({ task, onClose, onSubmit, onDelete }) {
  const [title, setTitle] = useState(task?.title || '');
  const [description, setDescription] = useState(task?.description || '');
  const [deadline, setDeadline] = useState(task?.deadline || '');
  const [priority, setPriority] = useState(task?.priority || 2);
  const [error, setError] = useState('');

  const handleSubmit = () => {
    if (!title.trim()) {
      setError('Le titre est obligatoire');
      return;
    }
    if (!priority) {
      setError('Veuillez sélectionner une priorité');
      return;
    }
    
    onSubmit({ title, description, deadline: deadline || null, priority, completed: false });
  };

  return (
    <>
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-end lg:items-center justify-center z-50">
        <div className="bg-white rounded-t-2xl lg:rounded-lg w-full lg:max-w-md max-h-[90vh] overflow-y-auto">
          <div className="sticky top-0 bg-white border-b p-4 flex items-center justify-between">
            <h2 className="text-lg font-bold">{task ? 'Modifier la Tache' : 'Nouvelle Tache'}</h2>
            <button onClick={onClose} className="p-2">
              <X size={24} />
            </button>
          </div>
          
          <div className="p-4">
            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">Titre *</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Ex: Finaliser les maquettes"
              />
            </div>
            
            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">Description</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows="2"
                placeholder="Details..."
              />
            </div>
            
            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">Date limite (optionnelle)</label>
              <input
                type="date"
                value={deadline}
                onChange={(e) => setDeadline(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            
            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">Priorité *</label>
              <div className="grid grid-cols-3 gap-2">
                {[1, 2, 3].map(p => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setPriority(p)}
                    className={`py-3 rounded-lg font-medium ${
                      priority === p
                        ? p === 1 ? 'bg-red-600 text-white' :
                          p === 2 ? 'bg-orange-600 text-white' :
                          'bg-green-600 text-white'
                        : 'bg-gray-100 text-gray-700'
                    }`}
                  >
                    P{p}
                  </button>
                ))}
              </div>
            </div>
            
            <div className="flex gap-2">
              {task && onDelete && (
                <button
                  onClick={onDelete}
                  className="px-4 py-3 bg-red-50 text-red-600 rounded-lg font-medium hover:bg-red-100"
                >
                  Supprimer
                </button>
              )}
              <button onClick={onClose} className="flex-1 px-4 py-3 bg-gray-100 rounded-lg font-medium">
                Annuler
              </button>
              <button onClick={handleSubmit} className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-lg font-medium">
                {task ? 'Modifier' : 'Creer'}
              </button>
            </div>
          </div>
        </div>
      </div>
      
      {error && <ErrorPopup message={error} onClose={() => setError('')} />}
    </>
  );
}

function BottomNav() {
  const { view, setView } = useApp();

  return (
    <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t z-30">
      <div className="grid grid-cols-2 h-16">
        <button
          onClick={() => setView('dashboard')}
          className={`flex flex-col items-center justify-center gap-1 ${
            view === 'dashboard' ? 'text-blue-600' : 'text-gray-600'
          }`}
        >
          <Home size={24} />
          <span className="text-xs font-medium">Dashboard</span>
        </button>
        
        <button
          onClick={() => setView('projects')}
          className={`flex flex-col items-center justify-center gap-1 ${
            view === 'projects' ? 'text-blue-600' : 'text-gray-600'
          }`}
        >
          <CheckCircle size={24} />
          <span className="text-xs font-medium">Projets</span>
        </button>
      </div>
    </div>
  );
}

function DesktopSidebar() {
  const { view, setView, themes, activeTheme, setActiveTheme, signOut, addTheme, updateTheme, deleteTheme } = useApp();
  const [showThemeForm, setShowThemeForm] = useState(false);
  const [editingTheme, setEditingTheme] = useState(null);

  const handleThemeClick = (themeId) => {
    setActiveTheme(themeId);
    setView('projects');
  };

  return (
    <div className="hidden lg:block fixed left-0 top-0 h-full w-64 bg-white shadow-lg">
      <div className="p-6 border-b">
        <h1 className="text-2xl font-bold">Ma To-Do</h1>
      </div>

      <nav className="p-4 space-y-2">
        <button
          onClick={() => setView('dashboard')}
          className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg ${
            view === 'dashboard' ? 'bg-blue-50 text-blue-600 font-medium' : 'text-gray-700 hover:bg-gray-50'
          }`}
        >
          <Home size={20} />
          Dashboard
        </button>

        <button
          onClick={() => setView('projects')}
          className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg ${
            view === 'projects' ? 'bg-blue-50 text-blue-600 font-medium' : 'text-gray-700 hover:bg-gray-50'
          }`}
        >
          <CheckCircle size={20} />
          Projets
        </button>
      </nav>

      <div className="p-4 border-t">
        <div className="flex items-center justify-between mb-3 px-2">
          <h3 className="text-sm font-semibold text-gray-600">THEMES</h3>
          <button
            onClick={() => setShowThemeForm(true)}
            className="text-blue-600 hover:text-blue-700"
          >
            <Plus size={18} />
          </button>
        </div>
        <div className="space-y-1">
          {themes.map(theme => (
            <div
              key={theme.id}
              className={`group flex items-center gap-3 px-3 py-2 rounded-lg ${
                activeTheme === theme.id ? 'bg-gray-100' : 'hover:bg-gray-50'
              }`}
            >
              <button
                onClick={() => handleThemeClick(theme.id)}
                className="flex items-center gap-3 flex-1 min-w-0"
              >
                <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: theme.color }} />
                <span className="text-sm truncate">{theme.name}</span>
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setEditingTheme(theme);
                }}
                className="opacity-0 group-hover:opacity-100 p-1 hover:bg-gray-200 rounded transition-opacity"
              >
                <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                </svg>
              </button>
            </div>
          ))}
          {themes.length === 0 && (
            <p className="text-xs text-gray-500 text-center py-2">Aucun theme</p>
          )}
        </div>
      </div>

      <div className="p-4 border-t absolute bottom-0 left-0 right-0">
        <button
          onClick={signOut}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-red-600 hover:bg-red-50"
        >
          <LogOut size={20} />
          Deconnexion
        </button>
      </div>

      {showThemeForm && (
        <ThemeFormModal
          onClose={() => setShowThemeForm(false)}
          onSubmit={(theme) => {
            addTheme(theme);
            setShowThemeForm(false);
          }}
        />
      )}

      {editingTheme && (
        <ThemeFormModal
          theme={editingTheme}
          onClose={() => setEditingTheme(null)}
          onSubmit={(theme) => {
            updateTheme(editingTheme.id, theme);
            setEditingTheme(null);
          }}
          onDelete={() => {
            if (window.confirm('Supprimer ce theme ? Tous les projets et taches seront aussi supprimes.')) {
              deleteTheme(editingTheme.id);
              setEditingTheme(null);
            }
          }}
        />
      )}
    </div>
  );
}

function ThemeFormModal({ theme, onClose, onSubmit, onDelete }) {
  const [name, setName] = useState(theme?.name || '');
  const [color, setColor] = useState(theme?.color || '#3b82f6');

  const colors = [
    { name: 'Bleu', value: '#3b82f6' },
    { name: 'Vert', value: '#10b981' },
    { name: 'Violet', value: '#8b5cf6' },
    { name: 'Rose', value: '#ec4899' },
    { name: 'Orange', value: '#f97316' },
    { name: 'Rouge', value: '#ef4444' },
    { name: 'Jaune', value: '#eab308' },
    { name: 'Gris', value: '#6b7280' },
  ];

  const handleSubmit = () => {
    if (name.trim()) {
      onSubmit({ name, color });
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg w-full max-w-md p-6 m-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold">{theme ? 'Modifier le Theme' : 'Nouveau Theme'}</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded">
            <X size={20} />
          </button>
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium mb-2">Nom du theme</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Ex: Personnel, Travail..."
          />
        </div>

        <div className="mb-6">
          <label className="block text-sm font-medium mb-3">Couleur</label>
          <div className="grid grid-cols-4 gap-3">
            {colors.map((c) => (
              <button
                key={c.value}
                type="button"
                onClick={() => setColor(c.value)}
                className={`relative h-12 rounded-lg transition-all ${
                  color === c.value ? 'ring-2 ring-offset-2 ring-blue-500 scale-110' : 'hover:scale-105'
                }`}
                style={{ backgroundColor: c.value }}
              >
                {color === c.value && (
                  <CheckCircle className="absolute inset-0 m-auto text-white" size={24} />
                )}
              </button>
            ))}
          </div>
        </div>

        <div className="flex gap-2">
          {theme && onDelete && (
            <button
              onClick={onDelete}
              className="px-4 py-3 bg-red-50 text-red-600 rounded-lg font-medium hover:bg-red-100"
            >
              Supprimer
            </button>
          )}
          <button
            onClick={onClose}
            className="flex-1 px-4 py-3 bg-gray-100 rounded-lg font-medium hover:bg-gray-200"
          >
            Annuler
          </button>
          <button
            onClick={handleSubmit}
            className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700"
          >
            {theme ? 'Modifier' : 'Creer'}
          </button>
        </div>
      </div>
    </div>
  );
}

function App() {
  return (
    <AppProvider>
      <MainApp />
    </AppProvider>
  );
}

function MainApp() {
  const { view, user } = useApp();

  if (!user) return null;

  return (
    <div className="min-h-screen bg-gray-50">
      <DesktopSidebar />
      <MobileHeader />
      <MobileMenu />
      
      <div className="lg:ml-64 pt-16 lg:pt-0">
        {view === 'dashboard' && <Dashboard />}
        {view === 'projects' && <Projects />}
      </div>
      
      <BottomNav />
    </div>
  );
}

export default App;