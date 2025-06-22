package ls

import (
	"bytes"
	"fmt"
	"os/exec"
	"strings"
)

type GitDiffDetails struct {
	FilePath    string
	Status      string
	Insertions  int
	Deletions   int
	IsBinary    bool
}

func parseGitNameStatus(output string) []GitDiffDetails {
	var details []GitDiffDetails
	lines := strings.Split(strings.TrimSpace(output), "\n")
	
	for _, line := range lines {
		if line == "" {
			continue
		}
		
		parts := strings.Fields(line)
		if len(parts) < 2 {
			continue
		}
		
		status := parts[0]
		filePath := strings.Join(parts[1:], " ")
		
		detail := GitDiffDetails{
			FilePath: filePath,
			Status:   status,
		}
		
		details = append(details, detail)
	}
	
	return details
}

func getGitDiffDetails(worktreePath string) ([]GitDiffDetails, error) {
	// Stage all changes
	stageCmd := exec.Command("git", "add", "-A", ".")
	stageCmd.Dir = worktreePath
	if err := stageCmd.Run(); err != nil {
		return nil, fmt.Errorf("failed to stage changes: %w", err)
	}
	
	// Get name-status
	nameStatusCmd := getGitDiffNameStatusCommand()
	nameStatusCmd.Dir = worktreePath
	
	var nameStatusOut bytes.Buffer
	nameStatusCmd.Stdout = &nameStatusOut
	
	if err := nameStatusCmd.Run(); err != nil {
		// Reset staged changes before returning error
		resetCmd := exec.Command("git", "reset", "HEAD")
		resetCmd.Dir = worktreePath
		resetCmd.Run()
		return nil, fmt.Errorf("failed to get name-status: %w", err)
	}
	
	// Parse name-status output
	details := parseGitNameStatus(nameStatusOut.String())
	
	// Get detailed stats for each file
	for i := range details {
		if details[i].Status == "D" {
			// For deleted files, we need to get stats differently
			cmd := exec.Command("git", "diff", "--cached", "--numstat", "HEAD", "--", details[i].FilePath)
			cmd.Dir = worktreePath
			
			var out bytes.Buffer
			cmd.Stdout = &out
			
			if err := cmd.Run(); err == nil {
				output := strings.TrimSpace(out.String())
				if output != "" {
					parts := strings.Fields(output)
					if len(parts) >= 3 {
						if parts[0] == "-" && parts[1] == "-" {
							details[i].IsBinary = true
						} else {
							fmt.Sscanf(parts[0], "%d", &details[i].Insertions)
							fmt.Sscanf(parts[1], "%d", &details[i].Deletions)
						}
					}
				}
			}
		} else {
			// For added/modified files
			cmd := exec.Command("git", "diff", "--cached", "--numstat", "HEAD", "--", details[i].FilePath)
			cmd.Dir = worktreePath
			
			var out bytes.Buffer
			cmd.Stdout = &out
			
			if err := cmd.Run(); err == nil {
				output := strings.TrimSpace(out.String())
				if output != "" {
					parts := strings.Fields(output)
					if len(parts) >= 3 {
						if parts[0] == "-" && parts[1] == "-" {
							details[i].IsBinary = true
						} else {
							fmt.Sscanf(parts[0], "%d", &details[i].Insertions)
							fmt.Sscanf(parts[1], "%d", &details[i].Deletions)
						}
					}
				}
			}
		}
	}
	
	// Reset staged changes
	resetCmd := exec.Command("git", "reset", "HEAD")
	resetCmd.Dir = worktreePath
	resetCmd.Run()
	
	return details, nil
}

func getGitDiffNameStatusCommand() *exec.Cmd {
	return exec.Command("git", "diff", "--cached", "--name-status", "HEAD")
}