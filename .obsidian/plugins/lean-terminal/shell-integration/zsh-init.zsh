# Lean Terminal - shell integration for zsh
if [[ -n "$__LOT_SHELL_INTEGRATION" ]]; then return 0; fi
__LOT_SHELL_INTEGRATION=1
if [[ -n "$__LOT_USER_ZDOTDIR" ]]; then
  ZDOTDIR="$__LOT_USER_ZDOTDIR"
  [[ -f "$ZDOTDIR/.zshrc" ]] && source "$ZDOTDIR/.zshrc"
elif [[ -f "$HOME/.zshrc" ]]; then
  source "$HOME/.zshrc"
fi
__lot_precmd() {
  local ec="$?"
  printf '\e]133;D;%s\e\\' "$ec"
  printf '\e]133;A\e\\'
}
__lot_preexec() { printf '\e]133;B\e\\'; }
autoload -Uz add-zsh-hook
add-zsh-hook precmd __lot_precmd
add-zsh-hook preexec __lot_preexec
printf '\e]133;A\e\\'