{{- define "nathalie-lopez.labels" -}}
app.kubernetes.io/name: nathalie-lopez
app.kubernetes.io/instance: {{ .Release.Name }}
app.kubernetes.io/managed-by: {{ .Release.Service }}
{{- end }}

{{- define "nathalie-lopez.appSelector" -}}
app.kubernetes.io/name: nathalie-lopez
app.kubernetes.io/component: frontend
app.kubernetes.io/instance: {{ .Release.Name }}
{{- end }}

{{- define "nathalie-lopez.backendSelector" -}}
app.kubernetes.io/name: nathalie-lopez
app.kubernetes.io/component: backend
app.kubernetes.io/instance: {{ .Release.Name }}
{{- end }}
