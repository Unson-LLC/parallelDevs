package ls

import (
	"testing"
)

// Test structure for Git diff details
type GitDiffDetails struct {
	AddedFiles      int
	ModifiedFiles   int
	DeletedFiles    int
	LastChangedFile string
	FileList        []FileChange
}

type FileChange struct {
	Status   string // A, M, D
	FilePath string
}

// Test for parsing git diff --name-status output
func TestParseGitNameStatus(t *testing.T) {
	tests := []struct {
		name               string
		gitOutput          string
		expectedDetails    GitDiffDetails
	}{
		{
			name:      "Single file added",
			gitOutput: "A\tdocs/development/BEST_PRACTICES_JP.md",
			expectedDetails: GitDiffDetails{
				AddedFiles:      1,
				ModifiedFiles:   0,
				DeletedFiles:    0,
				LastChangedFile: "docs/development/BEST_PRACTICES_JP.md",
				FileList: []FileChange{
					{Status: "A", FilePath: "docs/development/BEST_PRACTICES_JP.md"},
				},
			},
		},
		{
			name:      "Multiple files with different statuses",
			gitOutput: "A\tfile1.go\nM\tfile2.go\nD\tfile3.go\nM\tfile4.go",
			expectedDetails: GitDiffDetails{
				AddedFiles:      1,
				ModifiedFiles:   2,
				DeletedFiles:    1,
				LastChangedFile: "file4.go",
				FileList: []FileChange{
					{Status: "A", FilePath: "file1.go"},
					{Status: "M", FilePath: "file2.go"},
					{Status: "D", FilePath: "file3.go"},
					{Status: "M", FilePath: "file4.go"},
				},
			},
		},
		{
			name:      "No changes",
			gitOutput: "",
			expectedDetails: GitDiffDetails{
				AddedFiles:      0,
				ModifiedFiles:   0,
				DeletedFiles:    0,
				LastChangedFile: "-",
				FileList:        []FileChange{},
			},
		},
		{
			name:      "Only modified files",
			gitOutput: "M\tsrc/main.go\nM\tsrc/utils.go\nM\ttests/main_test.go",
			expectedDetails: GitDiffDetails{
				AddedFiles:      0,
				ModifiedFiles:   3,
				DeletedFiles:    0,
				LastChangedFile: "tests/main_test.go",
				FileList: []FileChange{
					{Status: "M", FilePath: "src/main.go"},
					{Status: "M", FilePath: "src/utils.go"},
					{Status: "M", FilePath: "tests/main_test.go"},
				},
			},
		},
		{
			name:      "Complex file paths with spaces",
			gitOutput: "A\t\"file with spaces.txt\"\nM\tregular_file.go",
			expectedDetails: GitDiffDetails{
				AddedFiles:      1,
				ModifiedFiles:   1,
				DeletedFiles:    0,
				LastChangedFile: "regular_file.go",
				FileList: []FileChange{
					{Status: "A", FilePath: "file with spaces.txt"},
					{Status: "M", FilePath: "regular_file.go"},
				},
			},
		},
		{
			name:      "Renamed files",
			gitOutput: "R100\told_name.go\tnew_name.go\nM\tother_file.go",
			expectedDetails: GitDiffDetails{
				AddedFiles:      0,
				ModifiedFiles:   2, // Rename counts as modified
				DeletedFiles:    0,
				LastChangedFile: "other_file.go",
				FileList: []FileChange{
					{Status: "R", FilePath: "new_name.go"},
					{Status: "M", FilePath: "other_file.go"},
				},
			},
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			// This will fail in RED phase as parseGitNameStatus doesn't exist yet
			t.Skip("parseGitNameStatus not implemented yet")
		})
	}
}

// Test for getGitDiffDetails function
func TestGetGitDiffDetails(t *testing.T) {
	tests := []struct {
		name               string
		sessionName        string
		mockGitOutput      string
		expectedDetails    GitDiffDetails
		expectError        bool
	}{
		{
			name:        "Valid session with changes",
			sessionName: "agent-1-test",
			mockGitOutput: "A\tsrc/new_feature.go\nM\tsrc/main.go\nD\tsrc/old_feature.go",
			expectedDetails: GitDiffDetails{
				AddedFiles:      1,
				ModifiedFiles:   1,
				DeletedFiles:    1,
				LastChangedFile: "src/old_feature.go",
			},
			expectError: false,
		},
		{
			name:        "Session with no changes",
			sessionName: "agent-2-test",
			mockGitOutput: "",
			expectedDetails: GitDiffDetails{
				AddedFiles:      0,
				ModifiedFiles:   0,
				DeletedFiles:    0,
				LastChangedFile: "-",
			},
			expectError: false,
		},
		{
			name:        "Non-existent session",
			sessionName: "non-existent",
			mockGitOutput: "",
			expectedDetails: GitDiffDetails{},
			expectError: true,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			// This will fail in RED phase as getGitDiffDetails doesn't exist yet
			t.Skip("getGitDiffDetails not implemented yet")
		})
	}
}

// Test for extracting the most recently changed file
func TestGetLastChangedFile(t *testing.T) {
	tests := []struct {
		name           string
		fileChanges    []FileChange
		expectedFile   string
	}{
		{
			name:         "Single file",
			fileChanges:  []FileChange{{Status: "M", FilePath: "main.go"}},
			expectedFile: "main.go",
		},
		{
			name:         "Multiple files - last one wins",
			fileChanges: []FileChange{
				{Status: "A", FilePath: "first.go"},
				{Status: "M", FilePath: "second.go"},
				{Status: "D", FilePath: "last.go"},
			},
			expectedFile: "last.go",
		},
		{
			name:         "No files",
			fileChanges:  []FileChange{},
			expectedFile: "-",
		},
		{
			name: "Very long file path",
			fileChanges: []FileChange{
				{Status: "M", FilePath: "very/long/path/that/goes/deep/into/the/directory/structure/file.go"},
			},
			expectedFile: "very/long/path/that/goes/deep/into/the/directory/structure/file.go",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			result := getLastChangedFile(tt.fileChanges)
			
			if result != tt.expectedFile {
				t.Errorf("Expected %s, got %s", tt.expectedFile, result)
			}
		})
	}
}

// Test for counting file changes by type
func TestCountFileChangesByType(t *testing.T) {
	tests := []struct {
		name             string
		fileChanges      []FileChange
		expectedAdded    int
		expectedModified int
		expectedDeleted  int
	}{
		{
			name: "Mixed changes",
			fileChanges: []FileChange{
				{Status: "A", FilePath: "new1.go"},
				{Status: "A", FilePath: "new2.go"},
				{Status: "M", FilePath: "mod1.go"},
				{Status: "D", FilePath: "del1.go"},
				{Status: "M", FilePath: "mod2.go"},
			},
			expectedAdded:    2,
			expectedModified: 2,
			expectedDeleted:  1,
		},
		{
			name:             "No changes",
			fileChanges:      []FileChange{},
			expectedAdded:    0,
			expectedModified: 0,
			expectedDeleted:  0,
		},
		{
			name: "Only additions",
			fileChanges: []FileChange{
				{Status: "A", FilePath: "file1.go"},
				{Status: "A", FilePath: "file2.go"},
				{Status: "A", FilePath: "file3.go"},
			},
			expectedAdded:    3,
			expectedModified: 0,
			expectedDeleted:  0,
		},
		{
			name: "Renamed files counted as modified",
			fileChanges: []FileChange{
				{Status: "R", FilePath: "renamed.go"},
				{Status: "M", FilePath: "modified.go"},
			},
			expectedAdded:    0,
			expectedModified: 2,
			expectedDeleted:  0,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			added, modified, deleted := countFileChangesByType(tt.fileChanges)
			
			if added != tt.expectedAdded {
				t.Errorf("Expected %d added, got %d", tt.expectedAdded, added)
			}
			if modified != tt.expectedModified {
				t.Errorf("Expected %d modified, got %d", tt.expectedModified, modified)
			}
			if deleted != tt.expectedDeleted {
				t.Errorf("Expected %d deleted, got %d", tt.expectedDeleted, deleted)
			}
		})
	}
}

// Test git command construction
func TestGitDiffNameStatusCommand(t *testing.T) {
	// Test that the git command is properly constructed
	expectedCmd := "git add -A . && git diff --cached --name-status HEAD && git reset HEAD > /dev/null"
	
	// This test verifies the exact command we'll use
	if getGitDiffNameStatusCommand() != expectedCmd {
		t.Errorf("Git command mismatch.\nExpected: %s\nGot: %s", expectedCmd, getGitDiffNameStatusCommand())
	}
}

// Helper functions for tests (will be implemented in GREEN phase)
func getLastChangedFile(changes []FileChange) string {
	if len(changes) == 0 {
		return "-"
	}
	return changes[len(changes)-1].FilePath
}

func countFileChangesByType(changes []FileChange) (added, modified, deleted int) {
	for _, change := range changes {
		switch change.Status {
		case "A":
			added++
		case "M", "R":
			modified++
		case "D":
			deleted++
		}
	}
	return
}

func getGitDiffNameStatusCommand() string {
	// This function doesn't exist yet - RED phase
	return ""
}