import { Memory } from '../types/Memory';

export const sampleMemories: Memory[] = [
  {
    id: 1,
    title: "React useCallback Optimization",
    content: "Used useCallback to prevent unnecessary re-renders in the user dashboard. Wrapped the handleUserClick function and saw 40% performance improvement.",
    source: "Cursor",
    type: "code-snippet",
    tags: ["react", "performance", "hooks"],
    connections: [2, 5],
    strength: 0.9,
    project: "UserDashboard v2.1",
    date: "2025-06-08",
    links: [
      { type: "github", url: "https://github.com/company/dashboard/commit/abc123", title: "Performance optimization commit" }
    ]
  },
  {
    id: 2,
    title: "Auth0 Integration Epic",
    content: "JIRA-2156: Implement Auth0 silent authentication with refresh token rotation.",
    source: "Jira",
    type: "ticket",
    tags: ["auth0", "authentication", "jira"],
    connections: [1, 3],
    strength: 0.8,
    project: "Authentication Service",
    date: "2025-06-07",
    links: [
      { type: "jira", url: "https://company.atlassian.net/browse/JIRA-2156", title: "Auth0 Integration Epic" }
    ]
  },
  {
    id: 3,
    title: "Sprint Planning - Architecture Discussion",
    content: "Teams meeting notes: Decided to prioritize mobile responsiveness over new features.",
    source: "Teams",
    type: "meeting",
    tags: ["sprint-planning", "mobile", "teams-meeting"],
    connections: [2, 4],
    strength: 0.7,
    project: "Q2 Roadmap",
    date: "2025-06-05",
    links: []
  },
  {
    id: 4,
    title: "GitHub Copilot TypeScript Pattern",
    content: "Perfect prompt for generating TypeScript interfaces: 'Generate TypeScript interfaces for [entity] with nested [properties]'",
    source: "Copilot",
    type: "tool-tip",
    tags: ["copilot", "typescript", "interfaces"],
    connections: [3, 5],
    strength: 0.8,
    project: "API Gateway",
    date: "2025-06-04",
    links: []
  },
  {
    id: 5,
    title: "Design System Architecture",
    content: "SharePoint documentation: New design system using compound components pattern.",
    source: "SharePoint",
    type: "architecture",
    tags: ["design-system", "components", "sharepoint"],
    connections: [1, 4],
    strength: 0.9,
    project: "Design System v3",
    date: "2025-06-03",
    links: [
      { type: "figma", url: "https://figma.com/file/abc123/design-system", title: "Design System Figma" }
    ]
  }
];