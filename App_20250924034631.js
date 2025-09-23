import { useState, useEffect } from "react";
import "./App.css";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import axios from "axios";
import { Button } from "./components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./components/ui/tabs";
import { Badge } from "./components/ui/badge";
import { Checkbox } from "./components/ui/checkbox";
import { Textarea } from "./components/ui/textarea";
import { Progress } from "./components/ui/progress";
import { toast } from "sonner";
import { Upload, FileText, BarChart3, ArrowLeft, ArrowRight, Download } from "lucide-react";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

// Main Dashboard Component
const Dashboard = () => {
  const [textSamples, setTextSamples] = useState([]);
  const [currentSampleIndex, setCurrentSampleIndex] = useState(0);
  const [annotations, setAnnotations] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(false);

  // Annotation state
  const [selectedQuality, setSelectedQuality] = useState('');
  const [selectedIssues, setSelectedIssues] = useState([]);
  const [notes, setNotes] = useState('');

  // Pairwise comparison state
  const [pairwiseTexts, setPairwiseTexts] = useState([]);
  const [pairwiseLoading, setPairwiseLoading] = useState(false);

  const qualityOptions = [
    { value: 'good', label: 'Good', color: 'bg-green-500' },
    { value: 'average', label: 'Average', color: 'bg-yellow-500' },
    { value: 'poor', label: 'Poor', color: 'bg-red-500' }
  ];

  const issueOptions = [
    { value: 'grammar_error', label: 'Grammar Error' },
    { value: 'irrelevant_content', label: 'Irrelevant Content' },
    { value: 'harmful_unsafe', label: 'Harmful/Unsafe' },
    { value: 'incomplete_truncated', label: 'Incomplete/Truncated' }
  ];

  // Fetch data functions
  const fetchTextSamples = async () => {
    try {
      const response = await axios.get(`${API}/text-samples?limit=200`);
      setTextSamples(response.data);
    } catch (error) {
      console.error('Error fetching text samples:', error);
      toast.error('Failed to load text samples');
    }
  };

  const fetchAnalytics = async () => {
    try {
      const response = await axios.get(`${API}/analytics/summary`);
      setAnalytics(response.data);
    } catch (error) {
      console.error('Error fetching analytics:', error);
    }
  };

  const fetchPairwiseTexts = async () => {
    setPairwiseLoading(true);
    try {
      const response = await axios.get(`${API}/text-samples/random-pair`);
      setPairwiseTexts(response.data);
    } catch (error) {
      console.error('Error fetching pairwise texts:', error);
      toast.error('Failed to load text pair for comparison');
    }
    setPairwiseLoading(false);
  };

  const initializeSampleData = async () => {
    try {
      const response = await axios.post(`${API}/initialize-sample-data`);
      toast.success(response.data.message);
      fetchTextSamples();
      fetchAnalytics();
    } catch (error) {
      console.error('Error initializing sample data:', error);
      toast.error('Failed to initialize sample data');
    }
  };

  // Submit annotation
  const submitAnnotation = async () => {
    if (!selectedQuality) {
      toast.error('Please select a quality level');
      return;
    }

    const currentSample = textSamples[currentSampleIndex];
    if (!currentSample) return;

    setLoading(true);
    try {
      const annotationData = {
        text_sample_id: currentSample.id,
        quality_level: selectedQuality,
        issue_tags: selectedIssues,
        notes: notes || null
      };

      await axios.post(`${API}/annotations`, annotationData);
      toast.success('Annotation saved successfully!');
      
      // Reset form and move to next sample
      setSelectedQuality('');
      setSelectedIssues([]);
      setNotes('');
      
      if (currentSampleIndex < textSamples.length - 1) {
        setCurrentSampleIndex(currentSampleIndex + 1);
      } else {
        toast.success('You have completed all available samples!');
      }
      
      fetchAnalytics();
    } catch (error) {
      console.error('Error submitting annotation:', error);
      toast.error('Failed to save annotation');
    }
    setLoading(false);
  };

  // Submit pairwise comparison
  const submitPairwiseComparison = async (betterTextId) => {
    if (pairwiseTexts.length !== 2) return;

    setLoading(true);
    try {
      const comparisonData = {
        text_a_id: pairwiseTexts[0].id,
        text_b_id: pairwiseTexts[1].id,
        better_text_id: betterTextId
      };

      await axios.post(`${API}/pairwise-comparisons`, comparisonData);
      toast.success('Comparison saved successfully!');
      fetchPairwiseTexts();
      fetchAnalytics();
    } catch (error) {
      console.error('Error submitting comparison:', error);
      toast.error('Failed to save comparison');
    }
    setLoading(false);
  };

  // Export functions
  const exportAnnotations = async () => {
    try {
      const response = await axios.get(`${API}/export/annotations-csv`, {
        responseType: 'blob'
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'annotations.csv');
      document.body.appendChild(link);
      link.click();
      link.remove();
      
      toast.success('Annotations exported successfully!');
    } catch (error) {
      console.error('Error exporting annotations:', error);
      toast.error('Failed to export annotations');
    }
  };

  const exportFullDataset = async () => {
    try {
      const response = await axios.get(`${API}/export/full-dataset-csv`, {
        responseType: 'blob'
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'full_dataset.csv');
      document.body.appendChild(link);
      link.click();
      link.remove();
      
      toast.success('Full dataset exported successfully!');
    } catch (error) {
      console.error('Error exporting dataset:', error);
      toast.error('Failed to export dataset');
    }
  };

  // File upload handler
  const handleFileUpload = async (event, fileType) => {
    const file = event.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);

    try {
      const endpoint = fileType === 'csv' ? 'upload-csv' : 'upload-json';
      const response = await axios.post(`${API}/text-samples/${endpoint}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      
      toast.success(response.data.message);
      fetchTextSamples();
      fetchAnalytics();
    } catch (error) {
      console.error('Error uploading file:', error);
      toast.error('Failed to upload file');
    }
  };

  // Issue checkbox handler
  const handleIssueToggle = (issueValue, checked) => {
    if (checked) {
      setSelectedIssues([...selectedIssues, issueValue]);
    } else {
      setSelectedIssues(selectedIssues.filter(issue => issue !== issueValue));
    }
  };

  useEffect(() => {
    fetchTextSamples();
    fetchAnalytics();
  }, []);

  const currentSample = textSamples[currentSampleIndex];
  const progress = textSamples.length > 0 ? ((currentSampleIndex + 1) / textSamples.length) * 100 : 0;

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-6xl mx-auto">
        <header className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">AI Content Quality Evaluation</h1>
          <p className="text-gray-600">Annotate and evaluate AI-generated text for quality assessment</p>
        </header>

        <Tabs defaultValue="annotation" className="w-full">
          <TabsList className="grid w-full grid-cols-4 mb-8">
            <TabsTrigger value="annotation" data-testid="annotation-tab">
              <FileText className="w-4 h-4 mr-2" />
              Annotation
            </TabsTrigger>
            <TabsTrigger value="pairwise" data-testid="pairwise-tab">
              <BarChart3 className="w-4 h-4 mr-2" />
              Pairwise
            </TabsTrigger>
            <TabsTrigger value="export" data-testid="export-tab">
              <Download className="w-4 h-4 mr-2" />
              Export
            </TabsTrigger>
            <TabsTrigger value="upload" data-testid="upload-tab">
              <Upload className="w-4 h-4 mr-2" />
              Upload
            </TabsTrigger>
          </TabsList>

          {/* Single Text Annotation Tab */}
          <TabsContent value="annotation">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Text Display */}
              <div className="lg:col-span-2">
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle>Text Sample {currentSampleIndex + 1} of {textSamples.length}</CardTitle>
                      {textSamples.length === 0 && (
                        <Button onClick={initializeSampleData} data-testid="init-sample-data-btn">
                          Initialize Sample Data
                        </Button>
                      )}
                    </div>
                    <Progress value={progress} className="w-full" />
                  </CardHeader>
                  <CardContent>
                    {currentSample ? (
                      <div className="space-y-4">
                        <div className="bg-white border rounded-lg p-6">
                          <p className="text-lg leading-relaxed text-gray-800" data-testid="current-text-sample">
                            {currentSample.text}
                          </p>
                        </div>
                        <div className="flex gap-2 text-sm text-gray-600">
                          {currentSample.topic && (
                            <Badge variant="outline">Topic: {currentSample.topic}</Badge>
                          )}
                          {currentSample.source && (
                            <Badge variant="outline">Source: {currentSample.source}</Badge>
                          )}
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-12 text-gray-500">
                        <FileText className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                        <p>No text samples available. Initialize sample data to get started.</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Annotation Panel */}
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Quality Assessment</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-3">
                      <label className="text-sm font-medium text-gray-700">Quality Level</label>
                      {qualityOptions.map((option) => (
                        <div
                          key={option.value}
                          className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                            selectedQuality === option.value
                              ? 'border-teal-500 bg-teal-50'
                              : 'border-gray-200 hover:border-gray-300'
                          }`}
                          onClick={() => setSelectedQuality(option.value)}
                          data-testid={`quality-${option.value}-option`}
                        >
                          <div className="flex items-center space-x-3">
                            <div className={`w-4 h-4 rounded-full ${option.color}`}></div>
                            <span className="font-medium">{option.label}</span>
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="space-y-3">
                      <label className="text-sm font-medium text-gray-700">Issue Tags (Optional)</label>
                      {issueOptions.map((issue) => (
                        <div key={issue.value} className="flex items-center space-x-3">
                          <Checkbox
                            checked={selectedIssues.includes(issue.value)}
                            onCheckedChange={(checked) => handleIssueToggle(issue.value, checked)}
                            data-testid={`issue-${issue.value}-checkbox`}
                          />
                          <label className="text-sm text-gray-700">{issue.label}</label>
                        </div>
                      ))}
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-700">Notes (Optional)</label>
                      <Textarea
                        placeholder="Add any additional notes..."
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        className="min-h-[80px]"
                        data-testid="annotation-notes-textarea"
                      />
                    </div>

                    <Button
                      onClick={submitAnnotation}
                      disabled={loading || !selectedQuality}
                      className="w-full"
                      data-testid="submit-annotation-btn"
                    >
                      {loading ? 'Saving...' : 'Submit Annotation'}
                    </Button>
                  </CardContent>
                </Card>

                {/* Navigation */}
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex justify-between">
                      <Button
                        variant="outline"
                        onClick={() => setCurrentSampleIndex(Math.max(0, currentSampleIndex - 1))}
                        disabled={currentSampleIndex === 0}
                        data-testid="prev-sample-btn"
                      >
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Previous
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => setCurrentSampleIndex(Math.min(textSamples.length - 1, currentSampleIndex + 1))}
                        disabled={currentSampleIndex >= textSamples.length - 1}
                        data-testid="next-sample-btn"
                      >
                        Next
                        <ArrowRight className="w-4 h-4 ml-2" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          {/* Pairwise Comparison Tab */}
          <TabsContent value="pairwise">
            <Card>
              <CardHeader>
                <CardTitle>Pairwise Text Comparison</CardTitle>
                <CardDescription>
                  Compare two texts and select which one is better overall
                </CardDescription>
              </CardHeader>
              <CardContent>
                {pairwiseTexts.length === 2 ? (
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {pairwiseTexts.map((text, index) => (
                        <div key={text.id} className="space-y-4">
                          <div className="bg-white border rounded-lg p-6">
                            <div className="flex items-center justify-between mb-3">
                              <h3 className="font-semibold text-lg">Text {String.fromCharCode(65 + index)}</h3>
                              <div className="flex gap-2 text-sm">
                                {text.topic && <Badge variant="outline">{text.topic}</Badge>}
                              </div>
                            </div>
                            <p className="text-gray-800 leading-relaxed mb-4" data-testid={`pairwise-text-${index}`}>
                              {text.text}
                            </p>
                            <Button
                              onClick={() => submitPairwiseComparison(text.id)}
                              disabled={loading}
                              className="w-full"
                              variant="outline"
                              data-testid={`select-text-${index}-btn`}
                            >
                              {loading ? 'Saving...' : `Select Text ${String.fromCharCode(65 + index)} as Better`}
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                    
                    <div className="text-center">
                      <Button
                        onClick={fetchPairwiseTexts}
                        variant="outline"
                        disabled={pairwiseLoading}
                        data-testid="load-new-pair-btn"
                      >
                        {pairwiseLoading ? 'Loading...' : 'Load New Pair'}
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <BarChart3 className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                    <p className="text-gray-500 mb-4">No text pairs available for comparison</p>
                    <Button onClick={fetchPairwiseTexts} disabled={pairwiseLoading} data-testid="fetch-pairwise-texts-btn">
                      {pairwiseLoading ? 'Loading...' : 'Load Text Pair'}
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Export Tab */}
          <TabsContent value="export">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Analytics Overview</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {analytics ? (
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Total Samples:</span>
                        <span className="font-semibold" data-testid="total-samples-count">{analytics.total_samples}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Total Annotations:</span>
                        <span className="font-semibold" data-testid="total-annotations-count">{analytics.total_annotations}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Pairwise Comparisons:</span>
                        <span className="font-semibold" data-testid="total-comparisons-count">{analytics.total_comparisons}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Progress:</span>
                        <span className="font-semibold" data-testid="annotation-progress">{analytics.annotation_progress}</span>
                      </div>
                      
                      <div className="pt-4 border-t">
                        <h4 className="font-medium mb-2">Quality Distribution:</h4>
                        {Object.entries(analytics.quality_distribution).map(([level, count]) => (
                          <div key={level} className="flex justify-between text-sm">
                            <span className="capitalize">{level}:</span>
                            <span data-testid={`quality-${level}-count`}>{count}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <p className="text-gray-500">Loading analytics...</p>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Export Data</CardTitle>
                  <CardDescription>
                    Download your annotation data in CSV format
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Button
                    onClick={exportAnnotations}
                    className="w-full"
                    variant="outline"
                    data-testid="export-annotations-btn"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Export Annotations Only
                  </Button>
                  
                  <Button
                    onClick={exportFullDataset}
                    className="w-full"
                    variant="outline"
                    data-testid="export-full-dataset-btn"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Export Full Dataset
                  </Button>
                  
                  <div className="text-sm text-gray-600 pt-4 border-t">
                    <p><strong>Annotations Only:</strong> Contains just the annotation records</p>
                    <p><strong>Full Dataset:</strong> Contains text samples with their annotations joined</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Upload Tab */}
          <TabsContent value="upload">
            <Card>
              <CardHeader>
                <CardTitle>Upload Text Samples</CardTitle>
                <CardDescription>
                  Import new text samples from CSV or JSON files
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <h3 className="font-semibold">Upload CSV File</h3>
                    <p className="text-sm text-gray-600">
                      CSV should have columns: text, source (optional), topic (optional)
                    </p>
                    <input
                      type="file"
                      accept=".csv"
                      onChange={(e) => handleFileUpload(e, 'csv')}
                      className="w-full p-2 border border-gray-300 rounded-md"
                      data-testid="upload-csv-input"
                    />
                  </div>
                  
                  <div className="space-y-4">
                    <h3 className="font-semibold">Upload JSON File</h3>
                    <p className="text-sm text-gray-600">
                      JSON should be an array of objects with text, source, topic properties
                    </p>
                    <input
                      type="file"
                      accept=".json"
                      onChange={(e) => handleFileUpload(e, 'json')}
                      className="w-full p-2 border border-gray-300 rounded-md"
                      data-testid="upload-json-input"
                    />
                  </div>
                </div>
                
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="font-medium mb-2">Example Format:</h4>
                  <pre className="text-sm text-gray-600">
{`CSV:
text,source,topic
"This is a sample text",Demo,Technology

JSON:
[
  {
    "text": "This is a sample text",
    "source": "Demo",
    "topic": "Technology"
  }
]`}
                  </pre>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

function App() {
  return (
    <div className="App">
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Dashboard />} />
        </Routes>
      </BrowserRouter>
    </div>
  );
}

export default App;