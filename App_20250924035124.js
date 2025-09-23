function App() {
  return (
    <div className=\"App\">
      <BrowserRouter>
        <Routes>
          <Route path=\"/\" element={<Dashboard />} />
        </Routes>
      </BrowserRouter>
      <Toaster />
    </div>
  );
}