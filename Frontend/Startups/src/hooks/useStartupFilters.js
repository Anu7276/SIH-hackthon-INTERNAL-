import { useState, useMemo } from 'react';
import startupsData from '../data/startups.json';

export function useStartupFilters() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedTechnology, setSelectedTechnology] = useState('All');
  const [selectedState, setSelectedState] = useState('All');
  const [selectedFunding, setSelectedFunding] = useState([]);
  const [selectedStage, setSelectedStage] = useState([]);
  const [selectedIncubator, setSelectedIncubator] = useState('All');
  const [verifiedOnly, setVerifiedOnly] = useState(false);
  const [govSupportedOnly, setGovSupportedOnly] = useState(false);
  const [sortBy, setSortBy] = useState('newest');

  // Interaction State
  const [bookmarks, setBookmarks] = useState([]);
  const [comparedStartups, setComparedStartups] = useState([]);
  const [activeModalStartup, setActiveModalStartup] = useState(null);

  const resetFilters = () => {
    setSearchQuery('');
    setSelectedCategory('All');
    setSelectedTechnology('All');
    setSelectedState('All');
    setSelectedFunding([]);
    setSelectedStage([]);
    setSelectedIncubator('All');
    setVerifiedOnly(false);
    setGovSupportedOnly(false);
    setSortBy('newest');
  };

  const toggleBookmark = (id) => {
    if (bookmarks.includes(id)) {
      setBookmarks(bookmarks.filter((bId) => bId !== id));
    } else {
      setBookmarks([...bookmarks, id]);
    }
  };

  const toggleCompare = (startup) => {
    const exists = comparedStartups.some((s) => s.id === startup.id);
    if (exists) {
      setComparedStartups(comparedStartups.filter((s) => s.id !== startup.id));
    } else {
      if (comparedStartups.length >= 2) {
        alert('You can compare up to 2 startups at a time.');
        return;
      }
      setComparedStartups([...comparedStartups, startup]);
    }
  };

  const filteredStartups = useMemo(() => {
    return startupsData.startups.filter((item) => {
      // Category Filter
      if (selectedCategory !== 'All' && item.category !== selectedCategory) {
        return false;
      }

      // Technology Filter
      if (selectedTechnology !== 'All' && item.technology !== selectedTechnology && !item.techStack?.includes(selectedTechnology)) {
        return false;
      }

      // State Filter
      if (selectedState !== 'All' && item.state !== selectedState) {
        return false;
      }

      // Stage Filter
      if (selectedStage.length > 0 && !selectedStage.includes(item.stage)) {
        return false;
      }

      // Funding Filter
      if (selectedFunding.length > 0 && !selectedFunding.includes(item.funding)) {
        return false;
      }

      // Incubator Filter
      if (selectedIncubator !== 'All' && !item.incubator.toLowerCase().includes(selectedIncubator.toLowerCase())) {
        return false;
      }

      // Verification Filter
      if (verifiedOnly && !item.verified) return false;
      if (govSupportedOnly && !item.govSupported) return false;

      // Text Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const nameMatch = item.name.toLowerCase().includes(q);
        const taglineMatch = item.tagline.toLowerCase().includes(q);
        const founderMatch = item.founder.toLowerCase().includes(q);
        const stateMatch = item.state.toLowerCase().includes(q) || item.location.toLowerCase().includes(q);
        const techMatch = item.techStack ? item.techStack.some((t) => t.toLowerCase().includes(q)) : false;
        return nameMatch || taglineMatch || founderMatch || stateMatch || techMatch;
      }

      return true;
    }).sort((a, b) => {
      if (sortBy === 'alphabetical') {
        return a.name.localeCompare(b.name);
      } else if (sortBy === 'funding') {
        return (b.fundingAmount || '').localeCompare(a.fundingAmount || '');
      } else if (sortBy === 'trending') {
        return (b.trending ? 1 : 0) - (a.trending ? 1 : 0);
      } else {
        return b.foundedYear - a.foundedYear;
      }
    });
  }, [
    searchQuery,
    selectedCategory,
    selectedTechnology,
    selectedState,
    selectedFunding,
    selectedStage,
    selectedIncubator,
    verifiedOnly,
    govSupportedOnly,
    sortBy,
  ]);

  return {
    searchQuery,
    setSearchQuery,
    selectedCategory,
    setSelectedCategory,
    selectedTechnology,
    setSelectedTechnology,
    selectedState,
    setSelectedState,
    selectedFunding,
    setSelectedFunding,
    selectedStage,
    setSelectedStage,
    selectedIncubator,
    setSelectedIncubator,
    verifiedOnly,
    setVerifiedOnly,
    govSupportedOnly,
    setGovSupportedOnly,
    sortBy,
    setSortBy,
    resetFilters,
    bookmarks,
    toggleBookmark,
    comparedStartups,
    setComparedStartups,
    toggleCompare,
    activeModalStartup,
    setActiveModalStartup,
    filteredStartups,
    allData: startupsData
  };
}
