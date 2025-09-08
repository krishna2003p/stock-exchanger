const RoadMap = () => {
  return (
    <div
      className="relative min-h-screen bg-no-repeat bg-cover bg-center"
      style={{ backgroundImage: "url('/home/banner_bg_1.png')" }}
    >
      {/* Dark overlay for better text contrast */}
      <div className="absolute inset-0 bg-[#00150f] opacity-90"></div>

      <div className="relative z-10 py-20">
        <div className="container mx-auto px-4 sm:px-6 md:px-10 lg:px-20">
          <h2 className="text-4xl font-bold mb-5 text-left sm:text-center text-white">
            Our <span className="text-green-400">Roadmap</span>
          </h2>
          <p className="text-lg text-gray-300 text-left sm:text-center mb-10 max-w-3xl mx-auto">
            A product roadmap shows the path ahead, helps teams plan, and guides the delivery of the product.
          </p>
          <div className="relative">
            {/* Center vertical timeline line */}
            <div className="border-l-4 border-green-400 absolute h-full left-1/2 transform -translate-x-1/2"></div>

            <div className="space-y-16 sm:space-y-20 md:space-y-24">
              {[
                {
                  title: "Project Research",
                  priority: "P1",
                  description:
                    "Project research is the backbone of any successful project. It involves gathering information, setting objectives, and analyzing data to ensure the project is achievable. Without proper research, projects can fail due to lack of knowledge.",
                },
                {
                  title: "Framing Idea",
                  priority: "P2",
                  description:
                    "Framing the idea is crucial for project success. It involves defining the project's scope, identifying key stakeholders, and establishing a clear vision. A well-framed idea sets the foundation for all future work.",
                },
                {
                  title: "Design First Draft",
                  priority: "P3",
                  description:
                    "The design first draft is where creativity meets structure. It involves creating initial design concepts, wireframes, and prototypes. This stage is all about exploring ideas and finding the best solutions.",
                },
                {
                  title: "Final Design",
                  priority: "P4",
                  description:
                    "So after lots of reiterations, and endless tweaking, we finally landed on the final design. It's slick, it's modern, and it perfectly captures the essence of what we were aiming for. We couldn't be more excited to launch it!",
                },
                {
                  title: "Project Development",
                  priority: "P5",
                  description:
                    "So we're deep in project development here, and things are coming along nicely. We've got a solid plan in place and our team is firing on all cylinders. There's still work to be done, but we're excited about what we're building.",
                },
                {
                  title: "Launch Project",
                  priority: "P6",
                  description:
                    "Alright folks, it's time to get this project off the ground! We've been talking about it for weeks, and now it's time to launch. We've got all the pieces in place, so let's get to work and make this thing happen!",
                },
              ].map((milestone, index) => {
                const isLeft = index % 2 === 0;

                return (
                  <div
                    key={index}
                    className="relative flex flex-col md:flex-row justify-between items-start md:items-center w-full"
                  >
                    {/* Left side card or empty */}
                    <div
                      className={`relative w-full md:w-5/12 ${
                        isLeft ? "mb-6 md:mb-0 text-left" : "hidden md:block"
                      }`}
                    >
                      {isLeft && (
                        <div className="bg-white p-6 rounded-tr-4xl rounded-bl-4xl shadow-lg border border-gray-300 inline-block relative hover:scale-105 transition-transform duration-300 border-b-4 border-green-400">
                          <div className="flex items-center gap-4 justify-between mb-4">
                            <h3 className="text-xl font-semibold">{milestone.title}</h3>
                            <p className="text-green-400 font-bold text-2xl">
                              {milestone.priority}
                            </p>
                          </div>
                          <p className="text-gray-600">{milestone.description}</p>
                          {/* Arrow pointing to center line - hidden on small */}
                          <svg
                            className="hidden md:block absolute -right-[9.75rem] top-15 transform translate-y-1"
                            width="180"
                            height="150"
                            viewBox="10 -1 120 80"
                            fill="none"
                            xmlns="http://www.w3.org/2000/svg"
                          >
                            <path
                              d="M100 40 C75 40 75 0 50 0"
                              stroke="#10b981"
                              strokeWidth="2"
                              fill="none"
                              markerEnd="url(#arrowhead)"
                            />
                            <defs>
                              <marker
                                id="arrowhead"
                                markerWidth="10"
                                markerHeight="7"
                                refX="0"
                                refY="3.5"
                                orient="auto"
                                fill="#10b981"
                              >
                                <polygon points="0 0, 10 3.5, 0 7" />
                              </marker>
                            </defs>
                          </svg>
                        </div>
                      )}
                    </div>

                    {/* Center timeline dot */}
                    <div className="w-8 md:w-12 flex justify-center relative z-30 mt-0 md:mt-20">
                      <div className="bg-green-400 w-8 h-8 md:w-12 md:h-12 rounded-full border-4 border-white shadow-lg"></div>
                    </div>

                    {/* Right side card or empty */}
                    <div
                      className={`relative w-full md:w-5/12 ${
                        !isLeft ? "text-left md:mt-40" : "hidden md:block"
                      }`}
                    >
                      {!isLeft && (
                        <div className="bg-white p-6 rounded-tl-4xl rounded-br-4xl shadow-lg border border-gray-300 inline-block relative hover:scale-105 transition-transform duration-300 border-b-4 border-green-400">
                          <div className="flex items-center gap-4 justify-between mb-4">
                            <h3 className="text-xl font-semibold">{milestone.title}</h3>
                            <p className="text-green-400 font-bold text-2xl">
                              {milestone.priority}
                            </p>
                          </div>
                          <p className="text-gray-600">{milestone.description}</p>
                          {/* Arrow pointing to center line - hidden on small */}
                          <svg
                            className="hidden md:block absolute -left-[9.75rem] -top-10 transform translate-y-1 rotate-180"
                            width="180"
                            height="150"
                            viewBox="10 -1 120 80"
                            fill="none"
                            xmlns="http://www.w3.org/2000/svg"
                          >
                            <path
                              d="M100 40 C75 40 75 0 50 0"
                              stroke="#10b981"
                              strokeWidth="2"
                              fill="none"
                              markerEnd="url(#arrowhead)"
                            />
                            <defs>
                              <marker
                                id="arrowhead"
                                markerWidth="10"
                                markerHeight="7"
                                refX="0"
                                refY="3.5"
                                orient="auto"
                                fill="#10b981"
                              >
                                <polygon points="0 0, 10 3.5, 0 7" />
                              </marker>
                            </defs>
                          </svg>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RoadMap;
