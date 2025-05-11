// frontend/src/SummaryPage.jsx
import React, { useMemo } from 'react';
import { useTodos } from './TodoContext';
import moment from 'moment';
// --- ADDED: Chart.js imports ---
import { Pie, Bar } from 'react-chartjs-2';
import { Chart, ArcElement, Tooltip, Legend, BarElement, CategoryScale, LinearScale } from 'chart.js';
Chart.register(ArcElement, Tooltip, Legend, BarElement, CategoryScale, LinearScale);

function SummaryPage() {
  const { todos, loading, error } = useTodos();

  // --- Summary Stats ---
  const totalTasks = todos.length;
  const completedTasks = todos.filter(t => t.completed).length;
  const overdueTasks = todos.filter(t => !t.completed && t.dueDate && moment(t.dueDate).isBefore(moment(), 'day')).length;
  const pendingTasks = totalTasks - completedTasks;

  // --- User Evaluation ---
  const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
  const overdueRate = totalTasks > 0 ? Math.round((overdueTasks / totalTasks) * 100) : 0;
  let performanceBadge = '';
  if (completionRate === 100) performanceBadge = 'Excellent! All tasks completed!';
  else if (completionRate >= 80) performanceBadge = 'Great job! Keep it up!';
  else if (completionRate >= 50) performanceBadge = 'Good progress, but room to improve.';
  else performanceBadge = 'Let\'s get more tasks done!';

  // --- Chart Data ---
  const chartData = {
    labels: ['Completed', 'Pending', 'Overdue'],
    datasets: [
      {
        data: [completedTasks, pendingTasks - overdueTasks, overdueTasks],
        backgroundColor: ['#198754', '#0d6efd', '#dc3545'],
        borderColor: ['#198754', '#0d6efd', '#dc3545'],
        borderWidth: 1,
      },
    ],
  };

  // Calculate tasks by tag (using useMemo for performance)
  const tasksByTag = useMemo(() => { // Renamed from tasksBySubject
      const counts = todos.reduce((acc, todo) => {
        const tag = todo.tag || 'General'; // Renamed from subject
        acc[tag] = (acc[tag] || 0) + 1;
        return acc;
      }, {});
       // Convert to array for easy mapping
      return Object.entries(counts).map(([tag, count]) => ({ tag, count })); // Renamed subject to tag
  }, [todos]);

  // --- Bar Chart Data for Tasks by Tag ---
  const barChartData = {
    labels: tasksByTag.map(t => t.tag),
    datasets: [
      {
        label: 'Tasks',
        data: tasksByTag.map(t => t.count),
        backgroundColor: '#0d6efd',
        borderRadius: 6,
        maxBarThickness: 32,
      },
    ],
  };

   // Calculate upcoming/overdue tasks
   const upcomingTasks = useMemo(() => {
       const now = moment().startOf('day');
       return todos.filter(todo =>
           !todo.completed && todo.dueDate && moment(todo.dueDate).isSameOrAfter(now, 'day') && moment(todo.dueDate).isBefore(now.clone().add(7, 'days'), 'day')
       ).sort((a, b) => moment(a.dueDate).valueOf() - moment(b.dueDate).valueOf());
   }, [todos]);

    const overdueTasksList = useMemo(() => {
       const now = moment().startOf('day');
       return todos.filter(todo =>
           !todo.completed && todo.dueDate && moment(todo.dueDate).isBefore(now, 'day')
       ).sort((a, b) => moment(a.dueDate).valueOf() - moment(b.dueDate).valueOf());
    }, [todos]);


  return (
    <div className="container mt-4">
      <h1 className="text-center mb-4">Task Summary</h1>

      {loading && <p className="text-center">Loading summary data...</p>}
      {error && <div className="alert alert-danger" role="alert">{error}</div>}

      {!loading && !error && todos.length === 0 && (
           <p className="text-center">Add some tasks to see the summary!</p>
      )}

      {!loading && !error && todos.length > 0 && (
        <>
          {/* --- Top Summary Card --- */}
          <div className="row mb-4">
            <div className="col-lg-10 mx-auto">
              <div className="card shadow-lg border-0" style={{ background: 'linear-gradient(90deg, #f8fafc 60%, #e3f2fd 100%)' }}>
                <div className="card-body d-flex flex-column flex-md-row align-items-center justify-content-between">
                  <div className="mb-3 mb-md-0">
                    <h5 className="card-title mb-1">
                      <span className="me-2" role="img" aria-label="tasks">🗂️</span> Total Tasks: <span className="badge bg-secondary fs-6">{totalTasks}</span>
                    </h5>
                    <div className="mb-1"><span className="me-2" role="img" aria-label="check">✅</span>Completed: <span className="badge bg-success fs-6">{completedTasks}</span></div>
                    <div className="mb-1"><span className="me-2" role="img" aria-label="pending">🕒</span>Pending: <span className="badge bg-primary fs-6">{pendingTasks}</span></div>
                    <div><span className="me-2" role="img" aria-label="overdue">⚠️</span>Overdue: <span className="badge bg-danger fs-6">{overdueTasks}</span></div>
                  </div>
                  <div style={{ width: 200, height: 200 }} className="bg-white rounded-4 shadow-sm p-2">
                    <Pie data={chartData} options={{ plugins: { legend: { position: 'bottom' } } }} />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* --- User Evaluation --- */}
          <div className="row mb-4">
            <div className="col-lg-10 mx-auto">
              <div className="card border-0 shadow-sm">
                <div className="card-body">
                  <div className="mb-2">
                    <strong>Completion Rate:</strong> {completionRate}%
                    <div className="progress my-1" style={{ height: 18 }}>
                      <div className="progress-bar bg-success" role="progressbar" style={{ width: `${completionRate}%` }} aria-valuenow={completionRate} aria-valuemin="0" aria-valuemax="100">{completionRate}%</div>
                    </div>
                  </div>
                  <div className="mb-2">
                    <strong>Overdue Rate:</strong> {overdueRate}%
                    <div className="progress my-1" style={{ height: 18 }}>
                      <div className="progress-bar bg-danger" role="progressbar" style={{ width: `${overdueRate}%` }} aria-valuenow={overdueRate} aria-valuemin="0" aria-valuemax="100">{overdueRate}%</div>
                    </div>
                  </div>
                  <div className="text-center mt-2">
                    <span className="badge bg-warning text-dark fs-6 px-3 py-2 shadow-sm">{performanceBadge}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* --- Tasks by Tag --- */}
          <div className="row mb-4">
            <div className="col-lg-10 mx-auto">
              <div className="card border-0 shadow-sm">
                <div className="card-body">
                  <h4 className="mb-3">Tasks by Tag</h4>
                  {tasksByTag.length === 0 ? (
                    <p>No tags tracked yet.</p>
                  ) : (
                    <div className="row align-items-center">
                      <div className="col-md-7">
                        <Bar data={barChartData} options={{
                          plugins: { legend: { display: false } },
                          scales: { y: { beginAtZero: true, ticks: { stepSize: 1 } } },
                          responsive: true,
                          maintainAspectRatio: false,
                        }} height={180} />
                      </div>
                      <div className="col-md-5">
                        <ul className="list-group mb-0">
                          {tasksByTag.map(({ tag, count }) => (
                            <li key={tag} className="list-group-item d-flex justify-content-between align-items-center">
                              {tag === 'General' ? 'General Tasks' : tag}
                              <span className="badge bg-primary rounded-pill">{count}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* --- Upcoming Deadlines --- */}
          <div className="row mb-4">
            <div className="col-lg-10 mx-auto">
              <div className="card border-0 shadow-sm">
                <div className="card-body">
                  <h4>Upcoming Deadlines (Next 7 Days)</h4>
                  {upcomingTasks.length === 0 ? (
                    <p>No upcoming tasks in the next 7 days.</p>
                  ) : (
                    <ul className="list-group mb-0">
                      {upcomingTasks.map(todo => (
                        <li key={todo._id} className="list-group-item">
                          <span role="img" aria-label="calendar">📅</span> <strong>{todo.text}</strong> ({todo.tag || 'General'}) - Due {moment(todo.dueDate).calendar()}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* --- Overdue Tasks --- */}
          <div className="row mb-4">
            <div className="col-lg-10 mx-auto">
              <div className="card border-0 shadow-sm">
                <div className="card-body">
                  <h4>Overdue Tasks</h4>
                  {overdueTasksList.length === 0 ? (
                    <p>No overdue tasks.</p>
                  ) : (
                    <ul className="list-group mb-0">
                      {overdueTasksList.map(todo => (
                        <li key={todo._id} className="list-group-item list-group-item-danger">
                          <span role="img" aria-label="warning">⚠️</span> <strong>{todo.text}</strong> ({todo.tag || 'General'}) - Was Due {moment(todo.dueDate).fromNow()}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            </div>
          </div>
        </>
      )}

    </div>
  );
}

export default SummaryPage;