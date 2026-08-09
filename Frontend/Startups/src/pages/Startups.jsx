import React from "react";
import Navbar from "../components/Header/Navbar";
import Hero from "../components/Hero/Hero";
import FilterSidebar from "../components/Filters/FilterSidebar";
import FeaturedCarousel from "../components/Featured/FeaturedCarousel";
import StartupGrid from "../components/StartupGrid/StartupGrid";
import Statistics from "../components/Statistics/Statistics";
import IndiaMap from "../components/Map/IndiaMap";
import SuccessStories from "../components/SuccessStories/SuccessStories";
import AIRecommendations from "../components/AIRecommendations/AIRecommendations";
import StartupComparison from "../components/StartupComparison/StartupComparison";
import CTA from "../components/CTA/CTA";
import DetailModal from "../components/Modal/DetailModal";
import { useStartupFilters } from "../hooks/useStartupFilters";

export default function StartupsPage() {
  const {
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
    allData,
  } = useStartupFilters();

  const featuredList = allData.startups.filter((s) => s.featured);

  return (
    <div className="min-h-screen pb-20 bg-[#FBF7EC]">
      {/* Official Government Navbar with Action Buttons */}
      <Navbar />

      {/* 1. Hero & Search */}
      <Hero
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        selectedCategory={selectedCategory}
        setSelectedCategory={setSelectedCategory}
        categories={allData.categories}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-8 py-8 space-y-12">
        {/* 3. Featured Carousel */}
        <FeaturedCarousel
          featuredList={featuredList}
          onSelectStartup={(s) => setActiveModalStartup(s)}
        />

        {/* 5. Statistics */}
        <Statistics stats={allData.stats} />

        {/* 2 & 4. Advanced Filters + Startup Grid */}
        <section id="directory" className="pt-4 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-200 pb-4">
            <div>
              <span className="text-xs font-bold text-[#2E7D32] uppercase tracking-widest">
                Central Platform
              </span>
              <h2 className="text-2xl sm:text-3xl font-extrabold font-cinzel text-[#1E3B22]">
                Explore AYUSH Startups ({filteredStartups.length})
              </h2>
            </div>
            {bookmarks.length > 0 && (
              <span className="text-xs font-bold bg-[#C1652E]/20 text-[#C1652E] px-3 py-1.5 rounded-full border border-[#C1652E]/30">
                {bookmarks.length} Bookmarked
              </span>
            )}
          </div>

          <div className="flex flex-col lg:flex-row gap-8 items-start">
            <FilterSidebar
              selectedCategory={selectedCategory}
              setSelectedCategory={setSelectedCategory}
              selectedTechnology={selectedTechnology}
              setSelectedTechnology={setSelectedTechnology}
              selectedState={selectedState}
              setSelectedState={setSelectedState}
              selectedFunding={selectedFunding}
              setSelectedFunding={setSelectedFunding}
              selectedStage={selectedStage}
              setSelectedStage={setSelectedStage}
              selectedIncubator={selectedIncubator}
              setSelectedIncubator={setSelectedIncubator}
              verifiedOnly={verifiedOnly}
              setVerifiedOnly={setVerifiedOnly}
              govSupportedOnly={govSupportedOnly}
              setGovSupportedOnly={setGovSupportedOnly}
              sortBy={sortBy}
              setSortBy={setSortBy}
              resetFilters={resetFilters}
              categories={allData.categories}
              technologies={allData.technologies}
              states={allData.states}
              stages={allData.stages}
              fundingTypes={allData.fundingTypes}
              totalResults={filteredStartups.length}
            />

            <div className="flex-1 w-full">
              <StartupGrid
                startups={filteredStartups}
                onSelectStartup={(s) => setActiveModalStartup(s)}
                bookmarks={bookmarks}
                onToggleBookmark={toggleBookmark}
                comparedStartups={comparedStartups}
                onToggleCompare={toggleCompare}
                resetFilters={resetFilters}
              />
            </div>
          </div>
        </section>

        {/* 8. AI Recommendations */}
        <AIRecommendations
          allStartups={allData.startups}
          selectedCategory={selectedCategory}
          onSelectStartup={(s) => setActiveModalStartup(s)}
        />

        {/* 6. India Startup Map */}
        <IndiaMap
          mapData={allData.mapData}
          onSelectStateFilter={(st) => {
            setSelectedState(st);
            const el = document.getElementById("directory");
            if (el) el.scrollIntoView({ behavior: "smooth" });
          }}
        />

        {/* 7. Success Stories */}
        <SuccessStories stories={allData.successStories} />

        {/* 10. Call To Action */}
        <CTA />
      </div>

      {/* 9. Startup Comparison Floating Bar & Matrix */}
      <StartupComparison
        comparedStartups={comparedStartups}
        onRemoveCompare={(id) =>
          setComparedStartups(comparedStartups.filter((s) => s.id !== id))
        }
        onClearAll={() => setComparedStartups([])}
      />

      {/* Detail Modal */}
      <DetailModal
        startup={activeModalStartup}
        onClose={() => setActiveModalStartup(null)}
      />
    </div>
  );
}
